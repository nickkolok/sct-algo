var fs = require('fs');
var ls = require('ls');


{

        function Vector2(x, y)
        {
            this.x = x;
            this.y = y;

        }
        Vector2.prototype.length = function ()
        {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        Vector2.dist = function (oV1, oV2)
        {
            return Math.sqrt((oV2.x - oV1.x) * (oV2.x - oV1.x) + (oV2.y - oV1.y) * (oV2.y - oV1.y));
        }

//Невозбранно скопипащено с  www.litunovskiy.com/gamedev/intersection_of_two_circles
}


function Point(x,y) {
	this.x=x;
	this.y=y;
	this.weight=0;
};


function calculateCandidatePoints(d){
	var timeBefore=Date.now();
	var candidatePoints=[];

	//Точки, которые по 4
	var d2 = Math.pow(d,2);
	for(var a=1; a<=d; a++){
		// a < b
		var a2 = Math.pow(a,2);
		for(var b=Math.max(d-a,a)+1; b<=d; b++){
			var y = (a2+d2 - Math.pow(b,2))/(2*d);
			var x = Math.sqrt(a2-Math.pow(y,2));
			candidatePoints.push(
				new Point(x,y),
				new Point(x,d-y),
				new Point(-x,y),
				new Point(-x,d-y)
			);
		}
	}

	// Точки, которые по 2
	var y = d/2;
	var y2 = Math.pow(y,2);
	for(var a=Math.floor(y)+1; a<=d; a++){
		var x = Math.sqrt(Math.pow(a,2)-y2);
		candidatePoints.push(
			new Point(x,y),
			new Point(-x,y)
		);
	}

	//Осевые точки

	for(var a=1; a<d; a++){
		candidatePoints.push(
			new Point(0,a)
		);
	}



	console.log("Массив точек-кандидатов составлен ("+(Date.now() - timeBefore)+" мс), всего точек: "+candidatePoints.length);
//	console.log(candidatePoints);
	return candidatePoints;
}

function areSymmetric(a,b,maxD){
	return a && b &&
		(a.x==-b.x || a.x==b.x)
	&&
		(a.y==b.y || a.y==maxD-b.y)
	;
}

function reduceCandidatePointsWithWeight(arr,minLinks,maxD){
	var m=minLinks-2;//Две неучтённых на основание

	for(var i=0; i<arr.length; i++){
		var links=arr[i].weight;
		arr[i].weight=0;

		for(var j=i+1; j<arr.length; j++){
			if(isZ(Vector2.dist(arr[i],arr[j]))){
				links++;
				arr[j].weight++;
			}
		}
		if(links<m){
			if(areSymmetric(arr[i],arr[arr.length-1])){
				arr.length--;
				if(areSymmetric(arr[i],arr[arr.length-1])){
					arr.length--;
					if(areSymmetric(arr[i],arr[arr.length-1])){
						arr.length--;
					}
				}
			}
			if(areSymmetric(arr[i],arr[i+1])){
				arr[i+1]=arr[arr.length-1];
				arr.length--;
				if(areSymmetric(arr[i],arr[i+2])){
					arr[i+2]=arr[arr.length-1];
					arr.length--;
					if(areSymmetric(arr[i],arr[i+3])){
						arr[i+3]=arr[arr.length-1];
						arr.length--;
					}
				}
			}
			arr[i]=arr[arr.length-1];
			arr.length--;
			i--;
		}
	}

}


function reduceCandidatePoints(arr,minLinks,maxD){
	var lengthBefore=arr.length;
	var timeBefore=Date.now();

	reduceCandidatePointsWithWeight(arr,minLinks,maxD);

	if(lengthBefore>arr.length){
		console.log("Граф урезан ("+(Date.now() - timeBefore)+" мс): было "+lengthBefore+", стало "+arr.length);
		if(minLinks >= 12){
			serializeCandidatePoints(arr,minLinks+1,maxD);
		}
		reduceCandidatePoints(arr,minLinks,maxD);
	}else{
		console.log("Холостой проход по графу ("+(Date.now() - timeBefore)+" мс)");
	}
}


function serializeCandidatePoints(arr,pow,maxD){
	var timeBefore=Date.now();
	var dumpName=pow+"_"+maxD+"_"+Date.now();
	fs.writeFileSync("dumps/"+dumpName+".sct.json",JSON.stringify(arr));
	console.log("Дамп "+dumpName+" записан ("+(Date.now() - timeBefore)+" мс)");
}

function deserializeCandidatePoints(pow,maxD){
	var dumps = ls('dumps/'+pow+'_'+maxD+'_*.sct.json');
	if(!dumps.length){
		// Нет нужного дампа
		console.log('Дамп для мощности '+pow+' и диаметра '+maxD+' не найден');
		return false;
	}
	var dump = dumps[dumps.length-1].full;
	try{
		console.log('Найден дамп '+dump);
		return JSON.parse(fs.readFileSync(dump,'utf-8'));
	}catch(e){
		console.log('Ошибка при чтении дампа '+dump);
		return false;
	}
}

function mapFriends(cand,maxD){
	for(var i=0; i<cand.length; i++){
		cand[i].friends=new Int8Array(cand.length);
		cand[i].friendsNums=[];
		for(var j=cand.length-1; j>i; j--){
			var d=Vector2.dist(cand[i],cand[j]);
			if( (d<=maxD+1/1000000) && isZ(d) ){
				cand[i].friends[j] = 1;
				cand[i].friendsNums.unshift(j);
			}
		}
	}
}

function workWithSCT(arr,cand,candNums,targetPow,maxD,current,firstX){
	if(arr.length>=targetPow){
		if(isNotTrivial(arr)){
			logSCT(arr);
		}
		return 1;
	}

	var last=arr[arr.length-1].friendsNums;
	var minFriends=targetPow-arr.length-1;
//	console.log(last);
	if(last[0]>=firstX){//У последней точки все друзья - осевые
		var firstXlocal=arr.length;
//		console.log(1);
		//И можно смело портить массив
		for(var j=0; j<last.length; j++){
			var bGoodPoint=true;
			for(var j2=2; j2<firstXlocal; j2++){//Первые две точки не берём - это концы основания
//				console.log(j2);
				if(!arr[j2].friends[last[j]]){
					bGoodPoint=false;
					break;
				}
			}
			if(bGoodPoint){
				arr.push(cand[last[j]]);
				if(arr.length==targetPow){
					logSCT(arr);
					return 1;
				}
			}
		}
	} else {
		for(var j=0; j<last.length; j++){
			var i=last[j];
			if(candNums[i] && cand[i].friends.length>=minFriends){
				var newarr=arr.slice();
				newarr.push(cand[i]);
				var candNumsNew=multArr(candNums,cand[i].friends);
				workWithSCT(newarr,cand,candNumsNew,targetPow,maxD,i,firstX);
			}
		}
	}
}


function isZ(d){
	return (d-Math.floor(d)<=1/1024/1024);
}

function generateArrayOfOnes(len){
	var arr=new Int8Array(len);
	for(var i=0; i<len; i++){
		arr[i]=1;
	}
	return arr;
}

function generateZeroNaturalSequence(len){
	var arr=[];
	for(var i=0; i<len; i++){
		arr[i]=i;
	}
	return arr;
}

function multArr(arr1,arr2){
	var len=Math.min(arr1.length,arr2.length);
	var rez=new Int8Array(len);
	for(var i=len-1; i>=0; i--){
		if(arr1[i] && arr2[i]){
			rez[i]=true;
		}
	}
	return rez;
}

function separateX(cand){
	var left=0;
	var right=cand.length-1;
	while(left<right){
		while(cand[left] && cand[left].x){
			left++;
		}
		while(cand[right] && !cand[right].x){
			right--;
		}
		if(left<right){
			var buf=cand[left];
			cand[left]=cand[right];
			cand[right]=buf;
		}
	}
	var firstX;
	for(firstX=0;firstX<cand.length && cand[firstX].x;firstX++){
	}
	return firstX;
}

function isFullSquare(n){
  while(!(n & 3)){
    n = n >> 2;
  }
  if((n & 7) != 1){
    return false;
  }
  var s = Math.sqrt(n);
  return s == Math.floor(s);

}

function reduceX(cand,firstX){
	var lengthBefore=cand.length;
	var timeBefore=Date.now();

	for(var i=firstX; i<cand.length; i++){
		var fl=false;
		for(var j=0; j<firstX; j++){
			if(isFullSquare(Math.pow(cand[i].x-cand[j].x,2)+Math.pow(cand[i].y-cand[j].y,2))){
				fl=true;
				break;
			}
		}
		if(!fl){
			cand[i]=cand[cand.length-1];
			i--;
			cand.length--;
		}
	}

	console.log("Удаление осевых точек ("+(Date.now() - timeBefore)+" мс): было "+lengthBefore+", стало "+cand.length+", неосевых "+firstX);
}

function getCandidatePoints(targetPow, maxD){
	var cand;
	if(cand = deserializeCandidatePoints(targetPow,maxD)){
		return cand;
	}
	return calculateCandidatePoints(maxD);
}

function findSCTs(targetPow,maxD){
	console.log('Ищем СЦТ мощности '+targetPow+' с основанием '+maxD);
	var t=new Date().getTime();
	var cand=getCandidatePoints(targetPow, maxD);
	reduceCandidatePoints(cand,targetPow-1,maxD);
	if(isNotTrivial(cand)){
		var firstX=separateX(cand);
		reduceX(cand,firstX);
		reduceCandidatePoints(cand,targetPow-1,maxD);
		firstX=separateX(cand);
		mapFriends(cand,maxD);
//		console.log(firstX);
//		console.log(cand[0].friendsNums);
		var candNums=generateArrayOfOnes(cand.length);
		var arr=[{x:0,y:0},{x:0,y:maxD}];
		arr[1].friendsNums=generateZeroNaturalSequence(firstX);
		workWithSCT(arr,cand,candNums,targetPow,maxD,0,firstX,1);
	}
	console.log('Времени затрачено, мс: '+(new Date().getTime()-t))
}


function isNotTrivial(arr){
	for(var i=0; i<arr.length; i++){
		if(arr[i].x){
			return 1;
		}
	}
	return 0;
}

function logSCT(arr){
	var rez = '\n';
	for(var i = 0; i < arr.length; i++){
		rez += '( '+arr[i].x+' ; '+arr[i].y+' );  \t  ';
	}
	console.log(rez);
	try{
		found=1;
	}catch(e){}
}

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
//var p=44;
//var d=964;
var p=3;
var d=1;
while(p<15){
	found=0;
	findSCTs(p,d);
	if(found){
		p++;
	} else {
		d++;
	}
}

