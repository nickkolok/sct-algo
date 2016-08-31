'use strict';

var fs = require('fs');
var ls = require('ls');
var clc= require('cli-color');
var reduce = require('./reductor-namespace.js');

const Point = require('./sct-common.js').Point;

function dist(oV1, oV2) {
	return Math.sqrt((oV2.x - oV1.x) * (oV2.x - oV1.x) + (oV2.y - oV1.y) * (oV2.y - oV1.y));
}


function emptyFunction(){
}


var handlers = {
	onfound: emptyFunction, // Первая найденная СЦТ
	onnotfound: emptyFunction, // Ни одной СЦТ не найдено
	onfinished: emptyFunction, // Найдены СЦТ, расчёт завершён
	ondumpsaved: emptyFunction, // Сохранён дамп
};

var auxillary = 0;
var logstr = "";
function logTimestamp(message,previousTime){
	var now = new Date();
	var rez = new Date(Date.now()+1000*60*60*3).toISOString().replace("T",'  ').replace('Z','')+'   '+message;
	if(previousTime){
		rez+=' ('+(now-previousTime)+' мс)';
	}
	logstr+=rez+"\n";
	if(auxillary){
		rez = clc.yellowBright(rez);
	}
	console.log(rez);
}

function writeLog(power,diameter){
	var logName = power+"_"+diameter+"_"+Date.now();
	fs.writeFileSync("logs/"+logName+".sct.log",logstr);

}

function calculateCandidatePoints(d){
	var timeBefore=Date.now();
	var candidatePoints=[];

	//Осевые точки

	// Если число чётное - добавляем серединку:
	if(!(d%2)){
		candidatePoints.push(
			new Point(0,d/2)
		);
	}

	//Остальные осевые - симметричными парами
	for(var a=1; a<d/2; a++){
		candidatePoints.push(
			new Point(0,a),
			new Point(0,d-a)
		);
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



	logTimestamp("Массив точек-кандидатов составлен, всего точек: "+candidatePoints.length, timeBefore);
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


function mapFriendsCount(arr,maxD){

	for(var i=0; i<arr.length; i++){
		arr[i].friendsCount = 0;
	}

	for(var i=0; i<arr.length; i++){
		for(var j=i+1; j<arr.length; j++){
			if(areFriends(arr[i],arr[j],maxD)){
				arr[i].friendsCount++;
				arr[j].friendsCount++;
			}
		}
	}
}




function serializeCandidatePoints(arr,pow,maxD,options){
	if(nodumpwrite || found || pow <= 25){
		return;
	}
	var timeBefore=Date.now();
	var dumpName=pow+"_"+maxD+"_"+Date.now()+"_"+arr.length;
	var text = JSON.stringify(arr);
	if(options){
		if(options.multiline){
			text = text.replace(/\}\,\{/g,"}, \n{")
		}
	}
	fs.writeFileSync("dumps/"+dumpName+".sct.json",text);
	logTimestamp("Дамп "+dumpName+" записан ("+(Date.now() - timeBefore)+" мс)");
	handlers.ondumpsaved();
}


function deserializeCandidatePoints(pow,maxD,twice){
	var dumps = ls('dumps/'+pow+'_'+maxD+'_*.sct.json');
	if(!dumps.length){
		// Нет нужного дампа
		logTimestamp('Дамп для мощности '+pow+' и основания  '+maxD+' не найден');
		if(twice){
			return false;
		}
		return deserializeCandidatePoints(pow-1,maxD,1);
	}
	var dump = dumps[dumps.length-1].full;
	try{
		logTimestamp('Найден дамп '+dump);
		var rez = JSON.parse(fs.readFileSync(dump,'utf-8'));
		logTimestamp('Дамп '+dump+' прочитан, точек: '+rez.length);
		return rez;
	}catch(e){
		logTimestamp('Ошибка при чтении дампа '+dump);
		return false;
	}
}

function mapFriends(cand,maxD){
	for(var i=0; i<cand.length; i++){
		cand[i].friends=new Int8Array(cand.length);
		cand[i].friendsNums=[];
		for(var j=cand.length-1; j>i; j--){
			if( areFriends(cand[i],cand[j],maxD) ){
				cand[i].friends[j] = 1;
				cand[i].friendsNums.unshift(j);
			}
		}
	}
}

function workWithSCT(arr,cand,candNums,targetPow,maxD,firstX){
	if(arr.length>=targetPow){
		if(isNotTrivial(arr)){
			logSCT(arr,targetPow,maxD);
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
					logSCT(arr,targetPow,maxD);
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
				workWithSCT(newarr,cand,candNumsNew,targetPow,maxD,firstX);
			}
		}
	}
}

const epsilon = 1/1024/1024;
function isZ(d){
	return (d-Math.floor(d)<=epsilon) || (Math.ceil(d) - d <=epsilon);
}


/*
function isZ(d){
	return (d-Math.floor(d)<=1/1024/1024);
}
*/

function generateArrayOfOnes(len){
	var arr=new Int8Array(len);
	for(var i=0; i<len; i++){
		arr[i]=1;
	}
	return arr;
}

function generateZeroNaturalSequence(len){
	return generateNaturalSequence(len,0);
}

function generateNaturalSequence(len,from){
	var arr=[];
	for(var i=0; i<len; i++){
		arr[i]=i+from;
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

// Стадии редукции
const
	STAGE_VIRGIN = 0,
	STAGE_STEP4 = 1,
	STAGE_STEP2_SOFT = 2,
	STAGE_STEP2X_SOFT = 3,
	STAGE_STEP2_HARD = 4,
	STAGE_STEP2X_HARD = 5,
	STAGE_SYMMETRIC = 6,
	STAGE_SYMMETRIC_MEASURED = 6,
	STAGE_ASYMMETRIC = 8,
	STAGE_ASYMMETRIC_MEASURED = 9,
	STAGE_COMPLETE = 10;

function reduceNext(arr,minLinks,maxD,stage){

	switch(stage){
		case STAGE_VIRGIN:
			reduce.setParams({
				virgin : 1,
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
		//break;
		case STAGE_STEP4:
			// В любом случае пихаем в редуктор переданное
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф четвёрками...');
//			reduce.unweighted4g2();
			reduce.unweighted4();
		break;
		case STAGE_STEP2_SOFT:
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф мягкими двойками...');
//			reduce.unweighted2soft();
			logTimestamp('Урезаем граф четвёрками...');
//			reduce.unweighted4();
		break;
		case STAGE_STEP2_HARD:
			// В любом случае пихаем в редуктор переданное
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф жёсткими двойками...');
//			reduce.unweighted2hard();
		break;
		case STAGE_STEP2X_SOFT:
			// В любом случае пихаем в редуктор переданное
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});

			logTimestamp('Урезаем граф мягкими осевыми двойками...');
//			reduce.unweighted2Xsoft();
			logTimestamp('Урезаем граф четвёрками...');
//			reduce.unweighted4();
			logTimestamp('Урезаем граф мягкими двойками...');
//			reduce.unweighted2soft();
			logTimestamp('Урезаем граф четвёрками...');
//			reduce.unweighted4();

		break;
		case STAGE_STEP2X_HARD:
			// В любом случае пихаем в редуктор переданное
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф жёсткими осевыми двойками...');
//			reduce.unweighted2Xhard();
		break;
		case STAGE_SYMMETRIC:
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф симметрично...');
			reduce.unweightedSymmetric();
		break;
		case STAGE_SYMMETRIC_MEASURED:
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф симметрично со сравнением расстояний...');
			reduce.unweightedSymmetricMeasured();
		break;
		case STAGE_ASYMMETRIC:
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф ассимметрично...');
			reduce.unweightedAsymmetric();
		break;
		case STAGE_ASYMMETRIC_MEASURED:
			reduce.setParams({
				diameter : maxD,
				points : arr,
				power : minLinks+1,
			});
			logTimestamp('Урезаем граф ассимметрично со сравнением расстояний...');
			reduce.unweightedAsymmetricMeasured();
		break;
	}


}


function reduceCandidatePoints(arr,minLinks,maxD,stage/*asymmetric,group,first4*/){
	if(stage == STAGE_COMPLETE){
		return;
	}
	var lengthBefore=arr.length;
	var timeBefore=Date.now();
	reduceNext(arr,minLinks,maxD,stage);

/*
	reduce.setParams({
		asymmetric : asymmetric,
		diameter : maxD,
//		first4 : first4,
		virgin : virginGraph,
		points : arr,
		power : minLinks+1,
	});
	if(group == 4){
		reduce.unweighted4();
	} else {
		reduce.unweighted();
	}
*/
	if(lengthBefore>arr.length){
		logTimestamp("Граф урезан: было "+lengthBefore+", стало "+arr.length,timeBefore);
		serializeCandidatePoints(arr,minLinks+1,maxD);
		reduceCandidatePoints(arr,minLinks,maxD,stage);
	}else{
		logTimestamp("Холостой проход по графу",timeBefore);
		reduceCandidatePoints(arr,minLinks,maxD,stage+1);
	}
}



function reduceX(cand,firstX,maxD){
	var lengthBefore=cand.length;
	var timeBefore=Date.now();

	for(var i=firstX; i<cand.length; i++){
		var fl=false;
		for(var j=0; j<firstX; j++){
			if(areFriends(cand[i],cand[j],maxD)){
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

	logTimestamp("Удаление осевых точек: было "+lengthBefore+", стало "+cand.length+", неосевых "+firstX, timeBefore);
}

var virginGraph = 1;
function getCandidatePoints(targetPow, maxD){
	var cand;
	if(!options.nodumpload && (cand = deserializeCandidatePoints(targetPow,maxD))){
		virginGraph = 0;
		return cand;
	}
	virginGraph = 1;
	return calculateCandidatePoints(maxD);
}

function findSCTs(targetPow,maxD){
	found = 0;
	console.log('\n\n');
	logTimestamp('Ищем СЦТ мощности '+targetPow+' с основанием '+maxD);
	if(options.solver){
		logTimestamp('Используется скрипт '+options.solver);
	}
	var t=new Date().getTime();
	var cand=getCandidatePoints(targetPow, maxD);
	reduceCandidatePoints(cand,targetPow-1,maxD,virginGraph?STAGE_VIRGIN:STAGE_SYMMETRIC);
//	reduceCandidatePoints(cand,targetPow-1,maxD);
	if(isNotTrivial(cand)){
		processGraphIterated(cand,targetPow,maxD);
	}
	logTimestamp('Расчёт для мощности '+targetPow+' и основания '+maxD+' закончен',t);
}

function selectFriends(arr,point,maxD){
	var newarr=[];
	for(var i=0; i<arr.length; i++){
		if(areFriends(arr[i],point,maxD)){
			newarr.push(arr[i]);
		}
	}
	return newarr;
}

var nodumpwrite = 0;
var found=0;

function processGraphIterated(cand,targetPow,maxD){
	if(cand.length < targetPow - 2){
		return;
	}
	separateX(cand);
	if(!cand[0].x){//Если остались только осевые
		return;
	}

	// Точку с наименьшим количеством соседей ставим первой и изучаем
	mapFriendsCount(cand,maxD);
	sortByFriendsCount(cand);

	var point = cand[0];

//	console.log(point);

	var candWith = selectFriends(cand,point,maxD);

//	console.log(candWith);

	auxillary = 1;
	nodumpwrite = 1;
//	console.log(point);
//	console.log(candWith);
	processGraph(candWith,targetPow,maxD);
	nodumpwrite = found;
	auxillary = 0;

	removeSymmetric(cand,point);
//	cand.splice(0,1);

	reduceCandidatePoints(cand,targetPow-1,maxD,STAGE_SYMMETRIC);

	serializeCandidatePoints(cand,targetPow,maxD);
	processGraphIterated(cand,targetPow,maxD);
}



function processGraph(cand,targetPow,maxD){
	var firstX=separateX(cand);
	reduceX(cand,firstX,maxD);
	reduceCandidatePoints(cand,targetPow-1,maxD,STAGE_ASYMMETRIC);
	firstX=separateX(cand);

	mapFriends(cand,maxD);
	var candNums=generateArrayOfOnes(cand.length);
	var arr=[new Point(0,0),new Point(0,maxD)];
	arr[1].friendsNums=generateZeroNaturalSequence(firstX);
	workWithSCT(arr,cand,candNums,targetPow,maxD,firstX,1);
}

function areFriends(p1,p2,maxD){
	var d = dist(p1,p2);
	return (d<=maxD+1/1000000) && isZ(d);
}

function removeSymmetric(arr,point){
	for(var i=0; i<arr.length; i++){
		if(areSymmetric(point,arr[i])){
			arr[i] = arr[arr.length-1];
			i--;
			arr.length--;
		}
	}
}

function isNotTrivial(arr){
	for(var i=0; i<arr.length; i++){
		if(arr[i].x){
			return 1;
		}
	}
	return 0;
}

function logSCT(arr,pow,maxD){
	var rez = '\n';
	for(var i = 0; i < arr.length; i++){
		rez += '( '+arr[i].x+' ; '+arr[i].y+' );  \t  ';
	}
	logTimestamp(clc.redBright(rez));
	try{
		found=1;
	}catch(e){
		logTimestamp('Не удалось поднять флаг успешного нахождения');
	}
	try{
		var dumpName=pow+"_"+maxD+"_"+Date.now();
		fs.writeFileSync("found/"+dumpName+".sct.json",JSON.stringify(arr));
	}catch(e){
		logTimestamp('Не удалось записать найденную СЦТ в файл');
	}
	try{
		handlers.onfound(arr,pow,maxD);
	}catch(e){
		logTimestamp('Не удалось поднять флаг успешного нахождения');
	}
}

var options = {};

function startSearch(p,d,h,opts){
	for(var handler in h){
		handlers[handler] = h[handler];
	}

	if(opts){
		for(var opt in opts){
			options[opt] = opts[opt];
		}
	}

	findSCTs(p,d);
	if(!found){
		handlers.onnotfound(p,d);
		serializeCandidatePoints([],p,d); // Чтоб уж гвоздями!
	}else{
		handlers.onfinished(p,d);
	}
	writeLog(p,d);
}


function sortByFriendsCount(arr){
	arr.sort(function(p1,p2){
		if(p1.x && !p2.x)
			return -1;
		if(!p1.x && p2.x)
			return 1;
		return p1.friendsCount - p2.friendsCount;
	});
}


module.exports.startSearch = startSearch;
