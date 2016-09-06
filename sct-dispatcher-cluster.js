var fs = require('fs');
var ls = require('ls');
var child_process=require('child_process');

var options = {
	counterDeadTime: 4*60*60*1000,
};
try{
	if(process.argv[4]){
		var parsedOptions = JSON.parse(process.argv[4]);
		for(var opt in parsedOptions){
			options[opt] = parsedOptions[opt];
		}
	}
}catch(e){
	console.log('Не удалось распознать список опций');
}



function logTimestamp(message){
	var now = new Date();
	var rez = now.toISOString().replace("T",'  ').replace('Z','')+'   '+message;
	console.log(rez);
}


const // Статусы процессов
	FINISHED_NOTFOUND = 0,
	FINISHED_FOUND = 1,
	RUNNING_NOTFOUNDYET = 2,
	RUNNING_FOUND = 3,
	PENDING_KILL = 4,
	NOTNEEDED = 5,
	STOPPED_FOUND = 6;


var state;

function translateProcessStatus(proc){
	if(!proc)
		return undefined;
	if(proc.status > 10000)
		return proc.status;
	return [0,1,undefined,6,undefined,5,6][proc.status];
}

function Counter (status){
	this.status = status;
	this.process = null;
}

function generateEmptyState(){
	state = [];
	for(var p = 3; p<200; p++){
		state[p]=[];
	}
}

function saveState() {
	logTimestamp('Сохраняем текущее состояние');
	var savedState = [];
	for(var i = 0; i < state.length; i++){
		savedState[i]=[];
		for(var j = 0; state[i] && j < state[i].length; j++){
			savedState[i][j] = translateProcessStatus(state[i][j]);
		}
	}
	var stateName = Date.now();
	fs.writeFileSync("states/"+stateName+".state.json",JSON.stringify(savedState));
}

function loadState() {
	logTimestamp('Читаем сохранённое состояние');
	generateEmptyState();

	var states = ls('states/*.state.json');
	if(!states.length){
		logTimestamp('Сохранённое состояние не найдено');
		return;
	}
	var st = states[states.length-1].full;
	try{
		var brief = JSON.parse(fs.readFileSync(st,'utf-8'));
		for(var i = 0; i<brief.length; i++){
			for(var j = 0; j<brief[i].length; j++){
				state[i][j]=new Counter(brief[i][j]);
			}
		}
	}catch(e){
		logTimestamp('Не удалось прочитать сохранённое состояние');
	}

}

function isStatusKillable(status){
	return
//		status == RUNNING_NOTFOUNDYET
		status > 10000
	||
		status == RUNNING_FOUND
	||
		status == PENDING_KILL
	;

}

function isProcessKillable(pow,diam){
	return state[pow][diam] && state[pow][diam].process && state[pow][diam].process.kill // Такой процесс вообще есть
		&& isStatusKillable(state[pow][diam].status); // И его имеет смысл убивать
}

function isStatusRunnable(status){
	return (
		status == undefined
	||
		status == null
	||
		status == STOPPED_FOUND
	||
		(Date.now() - status > options.counterDeadTime)
	);
}

function isProcessRunnable(pow,diam){
	return state[pow][diam] && isStatusRunnable(state[pow][diam].status);
}



function killCounter(pow,diam){
	try{
		if(isProcessKillable(pow,diam)){
			state[pow][diam].process.kill();
			state[pow][diam].status = NOTNEEDED;
			freeThreads++;
		}
	}catch(e){
		logTimestamp('Не удалось остановить процесс '+pow+'_'+diam);
	}
}

function killElder(pow,diam){
	for(var i = diam + 1; i < state[pow].length; i++){
		if(isProcessKillable(pow,diam)){
			state[pow][diam].status = PENDING_KILL;
		}
	}
}

function runCounter(pow,diam){
	try{
		if(isProcessRunnable(pow,diam)){
			state[pow][diam].process = child_process.fork(
				__dirname + '/sct-runner.js',
				[pow,diam,'',/*JSON.stringify({useNthDump:1})*/]
				/*,{silent:true}*/
			);
			state[pow][diam].process.on('message', receiveMessage); // Получили сообщение от процесса-потомка

			state[pow][diam].status = Date.now();//RUNNING_NOTFOUNDYET;
			freeThreads--;
			logTimestamp('Запущен процесс '+pow+'_'+diam);
		} else {
			logTimestamp('Невозможно запустить процесс '+pow+'_'+diam+', статус '+state[pow][diam].status);
		}
	}catch(e){
		logTimestamp('Не удалось запустить процесс '+pow+'_'+diam);
		console.error(e);
	}
}

function runElder(pow,diam){
	for(var i = pow; freeThreads>0; i++){
		runCounter(pow,diam);
	}
}

function receiveMessage (m) {
	loadState();
	logTimestamp('Принято сообщение от процесса '+m.power+'_'+m.diameter+':  '+JSON.stringify(m));
	switch(m.type){
		case 'found':
			killElder(m.power,m.diameter);
			state[m.power][m.diameter].status = RUNNING_FOUND;
		break;
		case 'finished':
			freeThreads++;
			state[m.power][m.diameter].status = FINISHED_FOUND;
		break;
		case 'notfound':
			freeThreads++;
			state[m.power][m.diameter].status = FINISHED_NOTFOUND;
		break;
		case 'step':
			if(state[m.power][m.diameter].status == PENDING_KILL){
			killProcess(m.power,m.diameter);
				state[m.power][m.diameter].status = NOTNEEDED;
			}
		break;
	}
	runNextCounter();
	saveState();
}

function runNextCounter(pow,diam){
	if(freeThreads <= 0){
		return;
	}

	pow || (pow = 3);
	diam || (diam = 1);
	if(!state[pow]){
		state[pow]=[];
	}
	if(!state[pow][diam]){
		state[pow][diam] = new Counter();
	}
	if( // Если не найдено (неважно, процесс ещё запущен или уже отработал)
		state[pow][diam].status == FINISHED_NOTFOUND
	||
//		state[pow][diam].status == RUNNING_NOTFOUNDYET
		state[pow][diam].status > 10000 && Date.now() - state[pow][diam].status < options.counterDeadTime
	){
		diam++;
	} else if( // Если найдено (неважно, процесс ещё запущен или уже отработал)
		state[pow][diam].status == FINISHED_FOUND
	||
		state[pow][diam].status == RUNNING_FOUND
	){
		pow++;
	} else if( // Если найдено, но до конца не доработало
		state[pow][diam].status == STOPPED_FOUND
	){
		runCounter(pow,diam);
		state[pow][diam].status = RUNNING_FOUND;
	} else if(isProcessRunnable(pow,diam)){
		runCounter(pow,diam);
//		state[pow][diam].status = RUNNING_NOTFOUNDYET;
	}
//	saveState();
	runNextCounter(pow,diam);
}

var freeThreads = process.argv[2] || require('os').cpus().length;
logTimestamp('Параллельных процессов: '+freeThreads);

loadState();
runNextCounter();
saveState();
