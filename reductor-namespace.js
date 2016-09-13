'use strict';

const Point = require('./sct-common.js').Point;

//{{ Дубли


function dist(oV1, oV2) {
	return Math.sqrt((oV2.x - oV1.x) * (oV2.x - oV1.x) + (oV2.y - oV1.y) * (oV2.y - oV1.y));
}

function distXY(x1,y1, oV2) {
	return Math.sqrt((oV2.x - x1) * (oV2.x - x1) + (oV2.y - y1) * (oV2.y - y1));
}


function areSymmetric(a,b){
	return a && b &&
		(a.x==-b.x || a.x==b.x)
	&&
		(a.y==b.y || (Math.abs(a.y+b.y-diameter) < epsilon))
	;
}


function isZ(d){
	return (d-Math.floor(d)<=epsilon) || (Math.ceil(d) - d <=epsilon);
	// return Math.abs(d-Math.round(d)<=epsilon); // Значительно медленнее
}

function areFriends(p1,p2){
	var d = dist(p1,p2);
	return (d<=diameterE) && isZ(d);
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

const epsilon = 1/1024/1024;

//}}Дубли


// Deprecated. При необходимости использования - переписать без лишних параметров
function weighted(arr,minLinks,diameter,asymmetric){
	//{{ DEBUG
		var totalComparisons = 0;
	//}} DEBUG

	var m=minLinks-2;//Две неучтённых на основание

	for(var i=0; i<arr.length; i++){
		var links=arr[i].weight;
		arr[i].weight=0;

		for(var j=i+1; j<arr.length; j++){
			totalComparisons++;
			if(isZ(dist(arr[i],arr[j]))){
				links++;
				arr[j].weight++;
			}
		}
		if(links<m){
			if(!asymmetric){
				if(areSymmetric(arr[i],arr[arr.length-1],diameter)){
					arr.length--;
					if(areSymmetric(arr[i],arr[arr.length-1],diameter)){
						arr.length--;
						if(areSymmetric(arr[i],arr[arr.length-1],diameter)){
							arr.length--;
						}
					}
				}
				if(areSymmetric(arr[i],arr[i+1],diameter)){
					arr[i+1]=arr[arr.length-1];
					arr.length--;
					if(areSymmetric(arr[i],arr[i+2],diameter)){
						arr[i+2]=arr[arr.length-1];
						arr.length--;
						if(areSymmetric(arr[i],arr[i+3],diameter)){
							arr[i+3]=arr[arr.length-1];
							arr.length--;
						}
					}
				}
			}
			arr[i]=arr[arr.length-1];
			arr.length--;
			i--;
		}
	}
	logTimestamp('Сравнений при урезке (алгоритм с весами): '+totalComparisons);
}


function unweightedSymmetric(){
	for(var i=0; i<points.length; i++){
		if(!isGoodPoint(points[i])){
			if(i<points.length-3){
//				console.log("\n");
//				console.log(points[i],links,i,points.length-1);
				if(areSymmetric(points[i],points[points.length-1])){
//					console.log('Под скрепочку:', points[points.length-1]);
					points.length--;
					if(areSymmetric(points[i],points[points.length-1])){
//						console.log('Под скрепочку:', points[points.length-1]);
						points.length--;
						if(areSymmetric(points[i],points[points.length-1])){
//							console.log('Под скрепочку:', points[points.length-1]);
							points.length--;
						}
					}
				}

				if(areSymmetric(points[i],points[i+1])){
					points[i+1]=points[points.length-1];
					points.length--;
					if(areSymmetric(points[i],points[i+2])){
						points[i+2]=points[points.length-1];
						points.length--;
						if(areSymmetric(points[i],points[i+3])){
							points[i+3]=points[points.length-1];
							points.length--;
						}
					}
				}
			}
			points[i]=points[points.length-1];
			points.length--;
			i--;
		} else {
			while(i<points.length && areSymmetric(points[i],points[i+1])){
				i++;
			}
		}
	}
}

function unweightedAsymmetric(){
	for(var i=0; i<points.length; i++){
		if(!isGoodPoint(points[i])){
			points[i]=points[points.length-1];
			points.length--;
			i--;
		}
	}
}

function unweightedSymmetricMeasured(){
	for(var i=0; i<points.length; i++){
		if(!isGoodPointMeasured(points[i])){

			if(areSymmetric(points[i],points[points.length-1])){
				points.length--;
				if(areSymmetric(points[i],points[points.length-1])){
					points.length--;
					if(areSymmetric(points[i],points[points.length-1])){
						points.length--;
					}
				}
			}
			if(areSymmetric(points[i],points[i+1])){
				points[i+1]=points[points.length-1];
				points.length--;
				if(areSymmetric(points[i],points[i+2])){
					points[i+2]=points[points.length-1];
					points.length--;
					if(areSymmetric(points[i],points[i+3])){
						points[i+3]=points[points.length-1];
						points.length--;
					}
				}
			}

			points[i]=points[points.length-1];
			points.length--;
			i--;
		} else {
			while(i<points.length && areSymmetric(points[i],points[i+1],diameter)){
				i++;
			}
		}
	}
}

function unweightedAsymmetricMeasured(){
	for(var i=0; i<points.length; i++){
		if(!isGoodPointMeasured(points[i])){
			points[i]=points[points.length-1];
			points.length--;
			i--;
		}
	}
}

//var links=0;

function isGoodPoint(point){
	var links = 0;
	for(var j=0; j<points.length; j++){
		if(isZ(dist(point,points[j]))){
			links++;
			if(links >= minLinks){
				return true;
			}
		}
	}
	return false;
}

function isGoodPointMapped(point,i){
	var links = 0;
	for(var j=0; j<points.length; j++){
		if(isZ(dist(point,points[j]))){
			links++;
			if(links >= minLinks){
				lastfriendmap4.push([i,j]);
				return true;
			}
		}
	}
	return false;
}


/*
function isGoodPoint(point){
	var links = 0;
	const x = point.x, y = point.y;
	for(var j=0; j<points.length; j++){
		if(isZ(distXY(x,y,points[j]))){
//			console.log(point,points[j],true);
			links++;
			if(links >= minLinks){
				return true;
			}
//		} else {
//			console.log(point,points[j],false, dist(point,points[j]), isZ(dist(point,points[j])));
		}
	}
	return false;
}
*/


function areGoodPoints2(point1,point2){
	var links1 = 0, links2 = 0;
	for(var j=0; j<points.length; j++){
		if(isZ(dist(point1,points[j]))){
			links1++;
			if(links1 >= minLinks){
				break;
			}
		}
		if(isZ(dist(point2,points[j]))){
			links2++;
			if(links2 >= minLinks){
				break;
			}
		}
	}
	for(var j1 = j; j1<points.length; j1++){
		if(isZ(dist(point1,points[j1]))){
			links1++;
			if(links1 >= minLinks){
				break;
			}
		}
	}
	for(var j2 = j; j2<points.length; j2++){
		if(isZ(dist(point2,points[j2]))){
			links2++;
			if(links2 >= minLinks){
				break;
			}
		}
	}
	var rez = 0 + (+(links1 >= minLinks))+2*(links2 >= minLinks);
	return rez;
}




function isGoodPointMeasured(point){
	var links=0;
	for(var j=0; j<points.length; j++){
		if(areFriends(point,points[j])){
			links++;
			if(links >= minLinks){
				return true;
			}
		}
	}
	return false;
}

function isGoodPointXVirgin(point){
	var links=0;

	// Проходим по всем неосевым
	for(var j=first2; j<points.length; j++){
		if(isZ(dist(point,points[j]))){
			links++;
			if(links >= minLinks){
				return true;
			}
		}
	}

	// Если ни одной соседки нет - в топку
	if(!links){
		return false;
	}

	// Бежать по осевым не нужно - они и так все соседки
	links += first2-1;

	return links >= minLinks;
}


function unweighted4(){
//	console.log(points);
	for(var i=first4; i<points.length; i+=4){
		if(!isGoodPoint(points[i])){
//			console.log(points[i],links,minLinks,points.length);
			points[i  ]=points[points.length-1];
			points[i+1]=points[points.length-2];
			points[i+2]=points[points.length-3];
			points[i+3]=points[points.length-4];
			points.length-=4;
			i-=4;
		}
	}
}


var pointsTransitionJournal = [];

function deletePointIfBadMapped(i){
	if(i>=points.length){
		if(pointsTransitionJournal[i]){
//			console.log('Перенаправление:' +i);
			deletePointIfBadMapped(pointsTransitionJournal[i]);
//		} else {
//			console.log('В молоко:' +i,pointsTransitionJournal[i]);
		}
		return;
	}
	if(!isGoodPointMapped(points[i],i)){
		points[i  ]=points[points.length-1];
		points[i+1]=points[points.length-2];
		points[i+2]=points[points.length-3];
		points[i+3]=points[points.length-4];
		pointsTransitionJournal[points.length-4] = i;
		points.length-=4;
		i-=4;
	}

}

var lastAliveTime = 0;
var aliveInterval = 60 * 1000;
function trySendAlive(){
	if(Date.now() > lastAliveTime + aliveInterval){
		lastAliveTime = Date.now();
		try{
			process.send({
				type:'alive',
				power: power,
				diameter: diameter,
			});
		}catch(e){
		}
	}
}

var lastSaveTime = 0;
var saveInterval = 30 * 60 * 1000;
function trySave(){
	if(Date.now() > lastSaveTime + saveInterval){
		lastSaveTime = Date.now();
		try{
			onstep();
		}catch(e){
		}
	}
}


function unweighted4Mapped(){
	lastfriendmap4 = [];
//	console.log(points);
	for(var i=first4; i<points.length; i+=4){
		if(!isGoodPointMapped(points[i],i)){
//			console.log(points[i],links,minLinks,points.length);
			points[i  ]=points[points.length-1];
			points[i+1]=points[points.length-2];
			points[i+2]=points[points.length-3];
			points[i+3]=points[points.length-4];
			points.length-=4;
			i-=4;
		}
		trySendAlive();
		trySave();
	}
}

function sortMap4(){
	lastfriendmap4.sort(
		(a,b) => (b[1] - a[1])
	);
//	console.log(lastfriendmap4);
}



function unweighted4MappedApply(){
	var oldlastfriendmap4 = lastfriendmap4;
	lastfriendmap4 = [];
	for(var j=0; j<oldlastfriendmap4.length; j++){
		deletePointIfBadMapped(oldlastfriendmap4[j][0]);
		trySendAlive();
	}
//	console.log(pointsTransitionJournal);
}

function unweighted4g2(){
//	console.log(points);
	for(var i=first4; i<points.length-4; i+=8){
		var rez = areGoodPoints2(points[i],points[i+4]);
/*
		if(rez & 1 != isGoodPoint(points[i])){
			console.log(1);
		}
		if(rez & 2 < isGoodPoint(points[i+4])){
			console.log(2);
		}
*/
		var j = i;
		if(!(rez & 1)){
//			console.log(points[i],links,minLinks,points.length);
			points[j  ]=points[points.length-1];
			points[j+1]=points[points.length-2];
			points[j+2]=points[points.length-3];
			points[j+3]=points[points.length-4];
			points.length-=4;
			i-=4;
		}
		if(!(rez & 2)){
//			console.log(points[i],links,minLinks,points.length);
			points[j+4]=points[points.length-1];
			points[j+5]=points[points.length-2];
			points[j+6]=points[points.length-3];
			points[j+7]=points[points.length-4];
			points.length-=4;
			i-=4;
		}
	}
}


function unweighted2hard(){
	for(var i=first2; i<points.length; i+=2){
		if(!isGoodPoint(points[i])){
			points[i  ]=points[points.length-1];
			points[i+1]=points[points.length-2];
			points.length-=2;
			i-=2;
		}
	}
}

function unweighted2Xhard(){
	for(var i=first2X; i<first2; i+=2){
		if(!isGoodPointXVirgin(points[i])){
			// Забираем последнюю пару осевых
			points[i  ]=points[first2-1];
			points[i+1]=points[first2-2];

			first2-=2;
			// На её место ставим последнюю пару вообще - на то оно и hard
			points[first2-1]=points[points.length-1];
			points[first2-2]=points[points.length-2];

			points.length-=2;
			i-=2;
		}
	}
}


var badPoint = new Point(Infinity,Infinity);

function unweighted2soft(){
	var firstBad;
//	console.log(points);
//	console.log(first2,first4);
	for(var i=first2; i<first4-4;){
		for(; i<first4-4; i+=2){
			if(!isGoodPoint(points[i])){
//				console.log(points[i], i, ' - на удаление');
				// Первую найденную пару - просто запороть/запомнить
				//points[i  ] = badPoint;
				//points[i+1] = badPoint;

				// Мы злопамятные!
				firstBad = i;
				// Если вторая не найдётся - то и фиг с ней
				i+=2;
				break;
			}
		}
		for(; i<first4-4; i+=2){
			if(!isGoodPoint(points[i])){
//				console.log(points[i], i, ' - удаляем');
//				console.log("_",firstBad,i);
				// Заменяем на "хорошие" точки с конца
				points[i  ] = points[first4-1];
				points[i+1] = points[first4-2];

				// Не забываем про запомненное
				points[firstBad  ] = points[first4-3];
				points[firstBad+1] = points[first4-4];

				// Втыкаем в конец четвёрку
				points[first4-1] = points[points.length-1];
				points[first4-2] = points[points.length-2];
				points[first4-3] = points[points.length-3];
				points[first4-4] = points[points.length-4];

				points.length-=4;
				first4-=4;
				i-=2;
				break;
			}
		}
	}
}

function unweighted2Xsoft(){
	var firstBad;
	for(var i=first2X; (i < first2 - 2) && (first4 - first2 >= 4);){
		for(; i<first2-2; i+=2){
			if(!isGoodPoint(points[i])){
				// Первую найденную пару - просто запороть
				points[i  ] = badPoint;
				points[i+1] = badPoint;

				// Мы злопамятные!
				firstBad = i;
				// Если вторая не найдётся - то и фиг с ней
				i+=2;
				break;
			}
		}
		for(; i<first2; i+=2){
			if(!isGoodPoint(points[i])){
				// Заменяем на "хорошие" точки с конца
				points[i  ] = points[first2-1];
				points[i+1] = points[first2-2];

				// Не забываем про запомненное
				points[firstBad  ] = points[first2-3];
				points[firstBad+1] = points[first2-4];


				// Ставим на это место две пары неосевых
				points[first2-1] = points[first4-1];
				points[first2-2] = points[first4-2];
				points[first2-3] = points[first4-3];
				points[first2-4] = points[first4-4];

				// Сдвигаем номер первой неосевой пары
				first2 -= 4;

				// Втыкаем в конец четвёрку
				points[first4-1] = points[points.length-1];
				points[first4-2] = points[points.length-2];
				points[first4-3] = points[points.length-3];
				points[first4-4] = points[points.length-4];

				points.length-=4;
				first4-=4;
				i-=2;
				break;
			}
		}
	}
}




module.exports.weighted = weighted;
module.exports.unweightedSymmetric = unweightedSymmetric;
module.exports.unweightedAsymmetric = unweightedAsymmetric;
module.exports.unweightedSymmetricMeasured = unweightedSymmetricMeasured;
module.exports.unweightedAsymmetricMeasured = unweightedAsymmetricMeasured;
module.exports.unweighted4 = unweighted4;
module.exports.sortMap4 = sortMap4;
module.exports.unweighted4Mapped = unweighted4Mapped;
module.exports.unweighted4MappedApply = unweighted4MappedApply;
module.exports.unweighted4g2 = unweighted4g2;
module.exports.unweighted2hard = unweighted2hard;
module.exports.unweighted2soft = unweighted2soft;
module.exports.unweighted2Xhard = unweighted2Xhard;
module.exports.unweighted2Xsoft = unweighted2Xsoft;
module.exports.checkGraphVirginity = checkGraphVirginity;


var
	power,minLinks,diameter,diameterE,
	points,
	virgin,
	first4,first2,first2X,
	lastfriendmap4,
	onstep
;

function checkGraphVirginity(){
	// Если диаметр чётный, должно начинаться с центра
	if(1 - diameter % 2){
		if(points[0].x != 0 || points[0].y != diameter/2){
//			console.log(1);
			return false;
		}
	}
	var f2X = 1 - diameter % 2
	var f2 = f2X;

	// Выбираем осевые двойки
	while(
		points[f2].x == 0
	&&
		points[f2+1].x == 0
	&&
		Math.abs(points[f2].y + points[f2+1].y - diameter) < epsilon

	){
		f2+=2;
	}

	// Теперь - четвёрки с конца
	var f4 = points.length - 4;
	while(
		areSymmetric(points[f4],points[f4+1])
	&&
		areSymmetric(points[f4],points[f4+2])
	&&
		areSymmetric(points[f4],points[f4+3])
	){
		f4-=4;
	}

	// Удостоверяемся, что всё оставшееся - симметричные двойки
	for(var i = f2; i<f4; i+=2){
		if(!areSymmetric(points[i],points[i+1])){
//			console.log(f2X,f2,f4,points[i],points[i+1])
			return false;
		}
	}
	first4  = f4 ;
	first2  = f2 ;
	first2X = f2X;
	return true;
}



function setParams(p){
	(p.first4  === undefined) || (first4  = p.first4 );
	(p.first2  === undefined) || (first2  = p.first2 );
	(p.first2X === undefined) || (first2X = p.first2X);

	power = +p.power;
	minLinks = +power - 2/* - 1*/;

	diameter = +p.diameter;
	diameterE = +diameter + epsilon;

	points = p.points;

	virgin = p.virgin; // Устанавливается для только что сгенерированного графа

	if(virgin){
		first4  || (first4  = +diameter - 1 + 2*Math.floor((+diameter+1)/2));
		first2  || (first2  = +diameter + 1);
		first2X || (first2X = 1 - diameter % 2);
	}

	onstep = p.onstep; // Функция, выполняемая после каждого шага

}
module.exports.setParams = setParams;

