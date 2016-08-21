var fs = require('fs');
var ls = require('ls');
var childProcess=require('child_process');


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
	return [0,1,undefined,6,undefined,5,6][proc.status];
}

function Counter (){
	this.status = undefined;
	this.process = null;
}

function generateEmptyState(){
	for(var p = 3; p<200; p++){
		state[p]=[];
	}
}

function saveState() {
	var savedState = [];
	for(var i = 0; i < state.length; i++){
		savedState[i]=[];
		for(var j = 0; j < state[i].length; j++){
			savedState[i][j] = translateProcessStatus(state[i][j]);
		}
	}
	var stateName = Date.now();
	fs.writeFileSync("states/"+stateNameName+".state.json",JSON.stringify(savedState));
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
		state = JSON.parse(fs.readFileSync(st,'utf-8'));
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
	return
		status == undefined
	||
		status == null
	||
		status == STOPPED_FOUND;
}

function isProcessRunnable(pow,diam){
	return state[pow][diam] && isStatusRunnable(state[pow][diam].status)
}


var freeThreads = 3; // Меняемо

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
		if(isProcessKillable(pow,diam){
			state[pow][diam].status = PENDING_KILL;
		}
	}
}

function runCounter(pow,diam){
	try{
		if(isProcessKillable(pow,diam)){
			state[pow][diam].process = child_process.fork(__dirname + '/sct-runner.js', [pow,diam]);
			children[i].on('message', receiveMessage); // Получили сообщение от процесса-потомка

			state[pow][diam].status = RUNNING_NOTFOUNDYET;
			freeThreads--;
		}
	}catch(e){
		console.log('Не удалось запустить процесс '+pow+'_'+diam);
	}
}

function runElder(pow,diam){
	for(var i = pow; freeThreads>0; i++){
		runCounter(pow,diam);
	}
}

function receiveMessage (m) {
	switch(m.type){
		case 'found':
			killElder(m.power,m.diameter);
		break;
		case 'finished':
			freeThreads++;
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


/*

	children[i] = childProcess.fork(__dirname + '/checkerProcess.js');



for(var i=0; i<threads; i++){
	children[i] = childProcess.fork(__dirname + '/checkerProcess.js');
	children[i].on('message', function (m) { // Получили сообщение от процесса-потомка
		switch(m.type){
			case 'quantity':
				totalQuantity+=m.quantity;
				childrenFinished++;
				if(childrenFinished==threads){
					process.send({
						type: 'quantity',
						quantity: totalQuantity,
					});
					process.exit();
				}
			break;
			case 'mistake':
				process.send(m);
			break;
		}
	});
}


child_process.fork(modulePath[, args][, options])#

Added in: v0.5.0
modulePath <String> The module to run in the child
args <Array> List of string arguments

*/





