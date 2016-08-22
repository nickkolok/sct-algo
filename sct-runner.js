const solver = require(process.argv[4] || './sct-2.js');

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

solver.startSearch(targetPow,maxD,{
	onfound: retranslator('found'),
	onnotfound: retranslator('notfound'),
	onfinished: retranslator('finished'),
	ondumpsaved: retranslator('step'),
});
