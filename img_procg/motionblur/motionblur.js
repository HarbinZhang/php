

var dims = [-1, -1];
var cc = 9e-3;

var canvases;
var ctxs;
var Y;
var H;
var M1;

var start;

var greyImage;

window.onload = function(){
	init();
}

var init = function() {
	canvases = [], ctxs = [];

	$('#L_selector').bind('input',function(e){
      var x = parseInt($('#L_selector').val());
      $('#L_val').html(x);
      start = +new Date();
      transformAction();
    });

    $('#sigma_selector').bind('input',function(e){
      var x = parseInt($('#sigma_selector').val());
      $('#sigma_val').html(x);
      start = +new Date();
      transformAction();
    });

    $('#lambda_selector').bind('input',function(e){
      var x = parseFloat($('#lambda_selector').val());
      $('#lambda_val').html(x);
      start = +new Date();
      reconstructAction();
    });

    loadImage('clown.png');



}


var loadImage = function(loc){
	start = +new Date();

	var img = new Image();
	img.addEventListener('load', function(){
		dims[0] = img.width;
		dims[1] = img.height;
		for( var i = 0; i < 3; i++){
			canvases[i] = $s('#canvas' + i);
			canvases[i].width = dims[0];
			canvases[i].height = dims[1];
			ctxs[i] = canvases[i].getContext('2d');
		}

		ctxs[0].drawImage(img, 0, 0, img.width, img.height);

		var imageData = ctxs[0].getImageData(0, 0, dims[0], dims[1]);


		greyImage = new GreyImage(img.width, img.height, imageData.data);

		console.log(greyImage);

		var h_es = [];
		for(var i = 0; i < imageData.data.length; i+=4){
			h_es.push(imageData.data[i]);
		}

		h = function(n, m){
			if(arguments.length === 0) return h_es;

			var idx = n * dims[0] + m;
			return h_es[idx];
		};

		// enableButtons();

		var duration = +new Date() - start; // unary add
		console.log('It took ' + duration + 'ms to draw the image.');
		transformAction();
		reconstructAction();
	});
	img.crossOrigin = "anonymous";
	img.src = loc;
}

function transformAction() {


	var L = $('#L_selector').val();
	// var L = 51;
	// var R1 = 2*R + 1;
	// var N1 = dims[1] + 2 * R;
	M1 = dims[0] + L - 1;



	// H = new_2D_Array(R1);
	// for(var i = 0; i < R1; i++){
	// 	for(var j = 0; j < R1; j++){
	// 		if((i-R)*(i-R) + (j-R)*(j-R) <= R*R){
	// 			H[i][j] = 1;
	// 		}
	// 	}
	// }
	H = ones(1, L);

	console.log(H);



	// var H2 = new_2D_Array(6);
	// for(var i = 0; i < 6; i++){
	// 	for(var j = 0; j < 6; j++){
	// 		H2[i][j] = 1;
	// 	}
	// }

	// var Y = conv2(H, H2);





	Y = conv2(H, greyImage.getData());
	console.log(Y);




    // draw the pixels
    var currImageData = ctxs[1].getImageData(
      0, 0, dims[0], dims[1]
    );
    
    for (var k = 0; k < dims[1]; k++) {
      for (var l = 0; l < dims[0]; l++) {
        var idxInPixels = 4*(dims[0]*k + l);
        currImageData.data[idxInPixels+3] = 255; // full alpha
        // RGB are the same -> gray
        for (var c = 0; c < 3; c++) { // lol c++
          currImageData.data[idxInPixels+c] = Y[k][l]/L;
        }
      }
    }
    ctxs[1].putImageData(currImageData, 0, 0);
 
    // enableButtons();
 
    var duration = +new Date() - start;
    console.log('It took '+duration+'ms to compute the FT.');

    return;

}


function reconstructAction() {
	var FFT_len = 512;


	FFT.init(FFT_len);
	// FFT.init(Y.length);
	// FFT.init(8);
	// var FYre = [], FYim = [];
	// var FYre = new Array(Y.length * Y[0].length);
	// var FYim = new Array(FYre.length);
	var FYre = new Array(FFT_len*FFT_len);
	var FYim = new Array(FFT_len*FFT_len);
	FYre.fill(0.0);
	FYim.fill(0.0);

	var FY_idx = 0;
	for(var y=0; y<Y.length; y++) {
		FY_idx = y * FFT_len;
		for(var x=0; x<Y[0].length; x++) {
			FYre[FY_idx++] = Y[y][x];
		}
	}	

	// console.log(FYre);


	// var FHre = [], FHim = [];
	var FHre = new Array(FFT_len*FFT_len);
	var FHim = new Array(FFT_len*FFT_len);
	FHre.fill(0);
	FHim.fill(0);


	// console.log(FHre);



	var H_idx = 0;
	for(var y = 0; y < H.length; y++){
		H_idx = y * FFT_len;
		for(var x = 0; x < H[0].length; x++){
			FHre[H_idx++] = H[y][x];
		}
	} 

	console.log(FHre);


	FFT.fft2d(FYre, FYim);
	FFT.fft2d(FHre, FHim);
	

	console.log("FYre: ", FYre);
	console.log("FYim: ", FYim);
	console.log("FHre: ", FHre);
	console.log("FHim: ", FHim);





	var lambda = $('#lambda_selector').val();

	var FXHATre = [];
	var FXHATim = [];
	for(var i = 0; i < FYre.length; i++){
		var tempre = (FYre[i] * FHre[i] + FYim[i] * FHim[i]) / (FHre[i]*FHre[i] + FHim[i]*FHim[i] + lambda*lambda);
		FXHATre.push(tempre);
		var tempim = (FYim[i] * FHre[i] - FYre[i] * FHim[i]) / (FHre[i]*FHre[i] + FHim[i]*FHim[i] + lambda*lambda);
		FXHATim.push(tempim);
	}




	// console.log(FXHATre);
	// console.log(FXHATim);


	// FFT.ifft2d(FYre, FYim);
	// FFT.ifft2d(FHre, FHim);
	FFT.ifft2d(FXHATre, FXHATim);
	// console.log(re);



	console.log(FXHATre);


	// // draw the pixels
	var currImageData = ctxs[2].getImageData(
	  0, 0, dims[0], dims[1]
	);

	// // console.log(greyImage);

	for (var k = 0; k < dims[1]; k++) {
	  for (var l = 0; l < dims[0]; l++) {
	    var idx = (dims[0]*k + l);
	    val = Math.round(FXHATre[FFT_len*k + l]);
	    currImageData.data[idx*4+3] = 255; // full alpha
	    for (var c = 0; c < 3; c++) { 
	      currImageData.data[4*idx+c] = val;
	    }
	  }
	}
	ctxs[2].putImageData(currImageData, 0, 0);

	// enableButtons();

	var duration = +new Date() - start;
	console.log('It took '+duration+'ms to reconstruct the image.');	
}





// function disableButtons(callback) {
// 	$s('#transform-btn').disabled = true;
// 	$s('#reconstruct-btn').disabled = true;

// 	setTimeout(callback, 6); // 6ms for the UI to update
// }



// function enableButtons() {
//   $s('#transform-btn').disabled = false;
//   $s('#reconstruct-btn').disabled = false;
// }

function $s(id) {
	if (id.charAt(0) !== '#') return false;
	return document.getElementById(id.substring(1));
}
