'use strict';

//{{ Дубли
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


function unweighted(){
	for(var i=0; i<points.length; i++){
		if(!isGoodPoint(points[i])){
			if(!asymmetric){
				if(areSymmetric(points[i],points[points.length-1],diameter)){
					points.length--;
					if(areSymmetric(points[i],points[points.length-1],diameter)){
						points.length--;
						if(areSymmetric(points[i],points[points.length-1],diameter)){
							points.length--;
						}
					}
				}
				if(areSymmetric(points[i],points[i+1],diameter)){
					points[i+1]=points[points.length-1];
					points.length--;
					if(areSymmetric(points[i],points[i+2],diameter)){
						points[i+2]=points[points.length-1];
						points.length--;
						if(areSymmetric(points[i],points[i+3],diameter)){
							points[i+3]=points[points.length-1];
							points.length--;
						}
					}
				}
			}
			points[i]=points[points.length-1];
			points.length--;
			i--;
		} else if(!asymmetric){
			while(i<points.length && areSymmetric(points[i],points[i+1],diameter)){
				i++;
			}
		}
	}
}

function isGoodPoint(point){
	var m=power-2;//Две неучтённых на основание плюс одна на себя
	var links=0;
	for(var j=0; j<points.length; j++){
		if(isZ(dist(point,points[j]))){
			links++;
			if(links >= m){
				return true;
			}
		}
	}
	return false;
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


module.exports.weighted = weighted;
module.exports.unweighted = unweighted;
module.exports.unweighted4 = unweighted4;

var
	first,asymmetric,
	power,diameter,diameterE,
	points,
	symmetric,virgin,
	first4,first2,
	onstep
;


function setParams(p){
	first4 = p.first4;
	first2 = p.first2;
	asymmetric = p.asymmetric;


	power = p.power;

	diameter = p.diameter;
	diameterE = diameter + epsilon;

	points = p.points;
	symmetric = p.symmetric;

	virgin = p.virgin; // Устанавливается для только что сгенерированного графа

	if(virgin){
		first4 || (first4 = diameter - 1 + 2*Math.floor((diameter+1)/2));
		first2 || (first2 = diameter - 1);
	}

	onstep = p.onstep; // Функция, выполняемая после каждого шага

}
module.exports.setParams = setParams;

