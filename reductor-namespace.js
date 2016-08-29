'use strict';

//{{ Дубли
function Point(x,y) {
	this.x=x;
	this.y=y;
//	this.weight=0;
};


function dist(oV1, oV2) {
	return Math.sqrt((oV2.x - oV1.x) * (oV2.x - oV1.x) + (oV2.y - oV1.y) * (oV2.y - oV1.y));
}

function areSymmetric(a,b){
	return a && b &&
		(a.x==-b.x || a.x==b.x)
	&&
		(a.y==b.y || a.y==diameter-b.y)
	;
}


function isZ(d){
	return d-Math.floor(d)<=epsilon;
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

//}}Дубли

const epsilon = 1/1024/1024;

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

function isGoodPoint(point){
	var links=0;
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
	for(var i=first4; i<points.length; i+=4){
		if(!isGoodPoint(points[i])){
			points[i  ]=points[points.length-1];
			points[i+1]=points[points.length-2];
			points[i+2]=points[points.length-3];
			points[i+3]=points[points.length-4];
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
	for(var i=first2; i<first4-2-2;){
		for(; i<first4-2-2; i+=2){
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
		for(; i<first4-2; i+=2){
			if(!isGoodPoint(points[i])){
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
module.exports.unweighted2hard = unweighted2hard;
module.exports.unweighted2soft = unweighted2soft;
module.exports.unweighted2Xhard = unweighted2Xhard;
module.exports.unweighted2Xsoft = unweighted2Xsoft;

var
	power,minLinks,diameter,diameterE,
	points,
	virgin,
	first4,first2,first2X,
	onstep
;


function setParams(p){
	(p.first4  === undefined) || (first4  = p.first4 );
	(p.first2  === undefined) || (first2  = p.first2 );
	(p.first2X === undefined) || (first2X = p.first2X);

	power = +p.power;
	minLinks = +power - 2;

	diameter = +p.diameter;
	diameterE = +diameter + epsilon;

	points = p.points;

	virgin = p.virgin; // Устанавливается для только что сгенерированного графа

	if(virgin){
		first4  || (first4 = +diameter - 1 + 2*Math.floor((+diameter+1)/2));
		first2  || (first2 = +diameter - 1);
		first2X || (first2 = 1 - diameter % 2);
	}

//	onstep = p.onstep; // Функция, выполняемая после каждого шага

}
module.exports.setParams = setParams;

