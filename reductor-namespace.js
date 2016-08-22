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


function unweighted(/*points,*/minLinks,diameter,asymmetric){
	//{{ DEBUG
//		var totalComparisons = 0;
	//}} DEBUG

	var m=minLinks-1;//Две неучтённых на основание плюс одна на себя

	for(var i=0; i<points.length; i++){
		var links=points[i].weight;

		for(var j=0; j<points.length; j++){
//			totalComparisons++;
			if(isZ(dist(points[i],points[j]))){
				links++;
//				totalComparisons++;
				if(links >= m){
					break;
				}
			}
		}
		if(links<m){
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
//	logTimestamp('Сравнений при урезке (алгоритм без весов): '+totalComparisons);
}

function unweighted4(/*points,*/minLinks/*,diameter,first*/){
	//{{ DEBUG
//		var totalComparisons = 0;
	//}} DEBUG

	var m=minLinks-1;//Две неучтённых на основание плюс одна на себя

	for(var i=first; i<points.length; i+=4){
		var links=0;

		for(var j=0; j<points.length; j++){
//			totalComparisons++;
			if(isZ(dist(points[i],points[j]))){
				links++;
//				totalComparisons++;
				if(links >= m){
					break;
				}
			}
		}
		if(links<m){
			points[i  ]=points[points.length-1];
			points[i+1]=points[points.length-2];
			points[i+2]=points[points.length-3];
			points[i+3]=points[points.length-4];
			points.length-=4;
			i-=4;
		}
	}
//	logTimestamp('Сравнений при урезке (алгоритм без весов): '+totalComparisons);
}

/*

function general(arr,minLinks,diameter,asymmetric,group,first){
	var lengthBefore=arr.length;
	var timeBefore=Date.now();

	if(group == 4){
		unweighted4(arr,minLinks,diameter,first);
	} else {
		unweighted(arr,minLinks,diameter,asymmetric);
	}
//	reduceCandidatePointsWithWeight(arr,minLinks,diameter,asymmetric);

	if(lengthBefore>arr.length){
		logTimestamp("Граф урезан: было "+lengthBefore+", стало "+arr.length,timeBefore);
		serializeCandidatePoints(arr,minLinks+1,diameter);
		general(arr,minLinks,diameter,asymmetric,group,first);
	}else{
		logTimestamp("Холостой проход по графу",timeBefore);
	}
}

function setParams(p){
	onstep = p.onstep;
}
*/
module.exports.weighted = weighted;
//module.exports.general = general;
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
//	diameter = p.diameter;
	first = p.first4;


	power = p.power;

	diameter = p.diameter;
	diameterE = diameter + epsilon;

	points = p.points;
	symmetric = p.symmetric;

	virgin = p.virgin; // Устанавливается для только что сгенерированного графа
	if(virgin){
		first4 = diameter-1+2*Math.floor((diameter+1)/2);
		first2 = diameter % 2;
	}

	onstep = p.onstep; // Функция, выполняемая после каждого шага

}
module.exports.setParams = setParams;

