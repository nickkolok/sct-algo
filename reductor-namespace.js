//{{ Дубли
function dist(oV1, oV2) {
	return Math.sqrt((oV2.x - oV1.x) * (oV2.x - oV1.x) + (oV2.y - oV1.y) * (oV2.y - oV1.y));
}

function areSymmetric(a,b,maxD){
	return a && b &&
		(a.x==-b.x || a.x==b.x)
	&&
		(a.y==b.y || a.y==maxD-b.y)
	;
}


function isZ(d){
	return (d-Math.floor(d)<=1/1024/1024);
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

//}}Дубли

function weighted(arr,minLinks,maxD,asymmetric){
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
				if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
					arr.length--;
					if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
						arr.length--;
						if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
							arr.length--;
						}
					}
				}
				if(areSymmetric(arr[i],arr[i+1],maxD)){
					arr[i+1]=arr[arr.length-1];
					arr.length--;
					if(areSymmetric(arr[i],arr[i+2],maxD)){
						arr[i+2]=arr[arr.length-1];
						arr.length--;
						if(areSymmetric(arr[i],arr[i+3],maxD)){
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


function unweighted(arr,minLinks,maxD,asymmetric){
	//{{ DEBUG
//		var totalComparisons = 0;
	//}} DEBUG

	var m=minLinks-1;//Две неучтённых на основание плюс одна на себя

	for(var i=0; i<arr.length; i++){
		var links=arr[i].weight;

		for(var j=0; j<arr.length; j++){
//			totalComparisons++;
			if(isZ(dist(arr[i],arr[j]))){
				links++;
//				totalComparisons++;
				if(links >= m){
					break;
				}
			}
		}
		if(links<m){
			if(!asymmetric){
				if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
					arr.length--;
					if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
						arr.length--;
						if(areSymmetric(arr[i],arr[arr.length-1],maxD)){
							arr.length--;
						}
					}
				}
				if(areSymmetric(arr[i],arr[i+1],maxD)){
					arr[i+1]=arr[arr.length-1];
					arr.length--;
					if(areSymmetric(arr[i],arr[i+2],maxD)){
						arr[i+2]=arr[arr.length-1];
						arr.length--;
						if(areSymmetric(arr[i],arr[i+3],maxD)){
							arr[i+3]=arr[arr.length-1];
							arr.length--;
						}
					}
				}
			}
			arr[i]=arr[arr.length-1];
			arr.length--;
			i--;
		} else if(!asymmetric){
			while(i<arr.length && areSymmetric(arr[i],arr[i+1],maxD)){
				i++;
			}
		}
	}
//	logTimestamp('Сравнений при урезке (алгоритм без весов): '+totalComparisons);
}

function unweighted4(arr,minLinks,maxD,first){
	//{{ DEBUG
//		var totalComparisons = 0;
	//}} DEBUG

	var m=minLinks-1;//Две неучтённых на основание плюс одна на себя

	for(var i=first; i<arr.length; i+=4){
		var links=0;

		for(var j=0; j<arr.length; j++){
//			totalComparisons++;
			if(isZ(dist(arr[i],arr[j]))){
				links++;
//				totalComparisons++;
				if(links >= m){
					break;
				}
			}
		}
		if(links<m){
			arr[i  ]=arr[arr.length-1];
			arr[i+1]=arr[arr.length-2];
			arr[i+2]=arr[arr.length-3];
			arr[i+3]=arr[arr.length-4];
			arr.length-=4;
			i-=4;
		}
	}
//	logTimestamp('Сравнений при урезке (алгоритм без весов): '+totalComparisons);
}

/*

function general(arr,minLinks,maxD,asymmetric,group,first){
	var lengthBefore=arr.length;
	var timeBefore=Date.now();

	if(group == 4){
		unweighted4(arr,minLinks,maxD,first);
	} else {
		unweighted(arr,minLinks,maxD,asymmetric);
	}
//	reduceCandidatePointsWithWeight(arr,minLinks,maxD,asymmetric);

	if(lengthBefore>arr.length){
		logTimestamp("Граф урезан: было "+lengthBefore+", стало "+arr.length,timeBefore);
		serializeCandidatePoints(arr,minLinks+1,maxD);
		general(arr,minLinks,maxD,asymmetric,group,first);
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
