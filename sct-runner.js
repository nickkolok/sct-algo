const defaultSolver = './sct-2-2.js'/*'./sct-2-2-temp-3.js'*/;
const realSolver = process.argv[4] || defaultSolver;
const solver = require(realSolver);

const targetPow = process.argv[2];
const maxD = process.argv[3];

function retranslator(type){
	return function(){
		try{
			process.send({
				power: targetPow,
				diameter: maxD,
				type: type,
			});
		}catch(e){
		}
	}
}

var options = {
	solver: realSolver,
};
try{
	if(process.argv[5]){
		var parsedOptions = JSON.parse(process.argv[5]);
		for(var opt in parsedOptions){
			options[opt] = parsedOptions[opt];
		}
	}
}catch(e){
	console.log('Не удалось распознать список опций');
}

solver.startSearch(targetPow,maxD,{
	onfound: retranslator('found'),
	onnotfound: retranslator('notfound'),
	onfinished: retranslator('finished'),
	ondumpsaved: retranslator('step'),
},options);
