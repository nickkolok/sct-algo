const fs =require('fs');
require('../ext/Object_generic.js');
require('../ext/String_tex.js');
require('../ext/String_generic.js');
require('../ext/number.js');
require('../ext/number_math.js');

function adaptPoint(point,diameter){
	return {
		x : point.y - diameter/2,
		y : point.x,
	};
}

function adaptArray(arr,diameter){
	var newArr = [];
	for(var i=0; i<arr.length; i++){
		newArr.push(adaptPoint(arr[i],diameter));
	}
	return newArr;
}

function logForCalc(arr){
	for(var i=0; i<arr.length; i++){
		console.log((arr[i].x+'\t'+arr[i].y).replace(/\./g,","));
	}
}

function sgn(x){
	// Для нуля считаем равным 1
	return x>0 ? 1 : -1;
}

const epsilon = 1/1024/1024;

function guessRadical(point,diameter){
	var absX = Math.abs(point.x);
	var absY = Math.abs(point.y);
//	console.log("?", absX, absY);
	const m = diameter; // Для читабельности формул
	for(var a = 0; a <= m; a++){
		for(var b = 0; b<=m /*&& a+b >= m*/; b++){
			var probX = Math.abs(a*a-b*b)/(2*m);
			var probY = Math.sqrt(
				4*a*a*m*m - (a*a-b*b+m*m).pow(2)
			)/(
				2*m
			);
//			console.log("!", probX, probY, a, b);
			if(Math.abs(absX - probX) < epsilon && Math.abs(absY - probY) < epsilon){
				return {
					x: (sgn(point.x)*Math.abs(a*a-b*b)).texfrac(2*diameter),
					y: (sgn(point.y)*Math.abs((4*a*a*m*m - (a*a-b*b+m*m).pow(2)))).texsqrtfrac(4*m*m),
				};
			}
		}
	}
	console.error(point," :: ", absX, absY);
}

function guessArray(arr,diameter){
	for(var i=0; i<arr.length; i++) {
		arr[i] = guessRadical(arr[i],diameter);
	}
}

function logArrayTex(arr){
	var rez = '\\left\\{';
	for(var i=0; i<arr.length; i++){
		rez += '\\left( '+arr[i].x + ' ; ' + arr[i].y + '\\right)';
	}
	rez += '\\right\\}';
	console.log(rez);
}

(function(){
	var filename = process.argv[2];

	if(!filename){
		console.error('Не указано имя файла');
		return;
	}
	var power    = +(filename.split("_")[0]);
	var diameter = +(filename.split("_")[1]);
	try{

		var arr = JSON.parse(fs.readFileSync(filename,'utf-8'));
	}catch(e){
		console.error('Не удалось прочитать СЦТ');
		console.error(e);
		return;
	}
	arr = adaptArray(arr,diameter);
	console.log(arr);
	logForCalc(arr);
	guessArray(arr,diameter);
	logArrayTex(arr);
//	console.log(guessRadical({ x: -1.5, y: -1.9364916731037085 },4));

})();
