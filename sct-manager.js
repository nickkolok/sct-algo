var solver = require('./sct-2.js');

var found=0;
function onfound(){
	found = 1;
}

var p = process.argv[2] || 3;
var d = process.argv[3] || 1;
var l = process.argv[4] || 1000;
while(d<=l){
	found=0;
	solver.startSearch(p,d,{onfound:onfound});
	if(found){
		p++;
	} else {
		d++;
	}
}
