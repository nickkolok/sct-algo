const solver = require('./sct-2.js');

const targetPow = process.argv[2];
const maxD = process.argv[2];

solver.startSearch(targetPow,maxD,{
//	onfound:{}

});
