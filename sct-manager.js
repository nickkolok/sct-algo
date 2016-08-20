var solver = require('./sct-2.js');


/*
3 1
4 4
5 7
6 8
7 17
8 24
9 26..35

34 553
*/
/*
findSCTs(4,5);
*/

var found=0;
function onfound(){
	found = 1;
}

//var p=44;
//var d=964;
var p=14;
var d=90;
while(d<95){
	found=0;
	solver.startSearch(p,d,onfound);
	if(found){
		p++;
	} else {
		d++;
	}
}
