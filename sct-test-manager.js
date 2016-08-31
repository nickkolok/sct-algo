var child_process=require('child_process');
var clc= require('cli-color');


function logTimestamp(message,color){
	var rez = new Date(Date.now()+1000*60*60*3).toISOString().replace("T",'  ').replace('Z','')+'   '+message;
	if(color){
		rez = clc[color](rez);
	}
	console.log(rez);
}

var totalErrors = 0;
var totalTests = 0;
var testsRunning = 0;

function createReaction(power,diameter,exists){
	return function(message){
		var text,color;
		if(message.type==='finished'){
			text = "СЦТ мощности "+power+"\t и диаметра "+diameter+"\t    найдена";
			if(exists){
				color = 'greenBright';
				text +=" - верно";
			} else {
				color = 'redBright';
				text +=" - ложноположительно";
				totalErrors++;
			}
		} else if(message.type==='notfound'){
			text = "СЦТ мощности "+power+"\t и диаметра "+diameter+"\t не найдена";
			if(!exists){
				color = 'greenBright';
				text +=" - верно";
			} else {
				color = 'redBright';
				text +=" - ложноотрицательно";
				totalErrors++;
			}
		} else {
			return;
		}
		testsRunning--;
		logTimestamp(text,color);
		logResultIfReady();
	}
}

function logResultIfReady(){
	if(!testsRunning){
		if(!totalErrors){
			logTimestamp('Тесты пройдены успешно','greenBright');
		} else {
			logTimestamp('Тестов провалено: '+totalErrors,'redBright');
		}
	}
}

function runTest(test){
	var child = child_process.fork(
		__dirname + '/sct-runner.js',
		[test.power,test.diameter,process.argv[2],JSON.stringify({nodumpload:true,})],
		{
			silent:true
		}
	);
	child.on('message',createReaction(test.power,test.diameter,test.exists));
	testsRunning++;
}


function runMainlineTests(){
	var mainlineTests = require('./success-tests-mainline.js');
	for(var i=0; i<mainlineTests.length; i++){
		runTest({
			power: mainlineTests[i].power,
			diameter: mainlineTests[i].diameter,
			exists: true,
		});

		if(mainlineTests[i].power > 3){
			runTest({
				power: mainlineTests[i].power,
				diameter: mainlineTests[i].diameter-1,
				exists: false,
			});
			runTest({
				power: mainlineTests[i].power-1,
				diameter: mainlineTests[i].diameter,
				exists: true,
			});
		}
	}
}

runMainlineTests();
