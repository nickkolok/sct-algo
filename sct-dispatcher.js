var fs = require('fs');
var ls = require('ls');
var child_process=require('child_process');


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
	generateEmptyState();

	var states = ls('states/*.state.json');
	if(!states.length){
		console.log('Сохранённое состояние не найдено');
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
		console.log('Не удалось прочитать сохранённое состояние');
	}

}

function isStatusKillable(status){
	return
		status == RUNNING_NOTFOUNDYET
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
		console.log('Не удалось остановить процесс '+pow+'_'+diam);
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
			state[pow][diam].process = child_process.fork(__dirname + '/sct-runner.js', [pow,diam],{silent:true});
			state[pow][diam].process.on('message', receiveMessage); // Получили сообщение от процесса-потомка

			state[pow][diam].status = RUNNING_NOTFOUNDYET;
			freeThreads--;
			console.log('Запущен процесс '+pow+'_'+diam);
		} else {
			console.log('Невозможно запустить процесс '+pow+'_'+diam+', статус '+state[pow][diam].status);
		}
	}catch(e){
		console.log('Не удалось запустить процесс '+pow+'_'+diam);
		console.error(e);
	}
}

function runElder(pow,diam){
	for(var i = pow; freeThreads>0; i++){
		runCounter(pow,diam);
	}
}

function receiveMessage (m) {
	console.log('Принято сообщение от процесса '+m.power+'_'+m.diameter+':  '+JSON.stringify(m));
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
		state[pow][diam].status == RUNNING_NOTFOUNDYET
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
	} else {
		runCounter(pow,diam);
		state[pow][diam].status = RUNNING_NOTFOUNDYET;
	}
	runNextCounter(pow,diam);
}

var freeThreads = 3; // Меняемо

loadState();
runNextCounter();
