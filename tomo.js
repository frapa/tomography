max_size = 400;

function loadImage(e) {
	var file = e.target.files[0];
	
	var reader = new FileReader();
	
	reader.onload = function (e) {
		var canvas = document.getElementById('preview');
		var context = canvas.getContext('2d');
		
		context.rect(0, 0, max_size, max_size);
		context.fillStyle = 'black';
		context.fill();
		
		var image = new Image();
  		image.src = e.target.result;
  		image.onload = function () {
			var w = image.width;
			var h = image.height;
			
			var nw, nh;
			if (w > max_size) {
				nw = max_size;
				nh = h / w * max_size;
			} else if (h > max_size) {
				nw = w / h * max_size;
				nh = max_size;
			} else {
				nw = w;
				nh = h;			
			}
			
			var sx = (max_size - nw) / 2;
			var sy = (max_size - nh) / 2;
			
			context.drawImage(this, sx, sy, nw, nh);
			blackWhite(context, max_size);
		}
	};
	
	reader.readAsDataURL(file);
}

function blackWhite (context, max_size) {
	var imageData = context.getImageData(0, 0, max_size, max_size);

	// This loop gets every pixels on the image and
   for (var j = 0; j < max_size; j++) {
      for (var i = 0; i < max_size; i++) {
         var index = (i*4) * max_size + (j*4);
         var red = imageData.data[index];
         var green = imageData.data[index+1];
         var blue = imageData.data[index+2];
         var average = (red + green + blue) / 3;
         
   	   imageData.data[index] = average;
         imageData.data[index+1] = average;
         imageData.data[index+2] = average;
         imageData.data[index+3] = 255;
       }
     }
     
     context.putImageData(imageData, 0, 0, 0, 0, max_size, max_size); 
}

function acquire() {
	var proj = document.getElementById('projections');
	nproj = parseInt(proj.value);

	var canvas = document.getElementById('preview');
	var context = canvas.getContext('2d');
	
	var memCanvas = document.createElement('canvas');
	memCanvas.width = max_size;
	memCanvas.height = max_size;
	var memContext = memCanvas.getContext('2d');
	memContext.drawImage(canvas, 0, 0, max_size, max_size);
	
	scan = new Float64Array(max_size * nproj);

	var progress = document.getElementById('progress');
	progress.max = nproj;
	progress.value = 0;
	
    acquireProjection(context, scan, memCanvas, max_size, nproj, 0, function ()
    {
        context.drawImage(memCanvas, 0, 0, max_size, max_size);
        drawSinogram(nproj);
    });
}

function acquireProjection(context, scan, memCanvas, max_size, nproj, i, callback) {
	var show_p = document.getElementById("show_projection").checked;
	var progress = document.getElementById('progress');
	var step_angle = Math.PI / nproj;

    context.save();
    context.translate(max_size/2, max_size/2);
    context.rotate(i*step_angle);
    context.drawImage(memCanvas, -max_size/2, -max_size/2, max_size, max_size);

    var imageData = context.getImageData(0, 0, max_size, max_size);		
    for (var j = 0; j < max_size; j++) {
        var sum = lineIntegral(imageData.data, j);
        scan[i*max_size + j] = sum;
    }
    
    context.restore();

    if (!show_p) {
        context.drawImage(memCanvas, 0, 0, max_size, max_size);
    } else {
        drawSinogram(nproj);
    }

	progress.value = i+1;
    
    if (i < nproj) {
        setTimeout(function () { 
            acquireProjection(context, scan, memCanvas, max_size, nproj, i+1, callback);
        }, 0);
    } else {
        callback();
    }
}

function drawFromData(data, cols, rows, id) {
	var canvas = null;
	var canvas = null;
	if (typeof id == 'string') {
		canvas = document.getElementById(id);
	} else {
		canvas = id;
	}
		
	var context = canvas.getContext('2d');
	var imgdat = context.getImageData(0, 0, cols, rows);	
	
	var minimum = Math.min(...data);
	var maximum = Math.max(...data);
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < cols; j++) {
			var index = (i*cols + j);
			
			var val = (data[index] - minimum) / (maximum - minimum) * 255;
			
			imgdat.data[index*4] = val;
            imgdat.data[index*4 + 1] = val;
            imgdat.data[index*4 + 2] = val;
            imgdat.data[index*4 + 3] = 255;
		}
	}
	
	context.putImageData(imgdat, 0, 0, 0, 0, cols, rows);
}

function drawSinogram(nproj) {
	var scanvas = document.getElementById('scan');
	scanvas.height = nproj;
	
	drawFromData(scan, max_size, nproj, 'scan');
}

function lineIntegral(data, x) {
	var sum = 0;
	
	for (var y = 0; y < max_size; y++) {
		var index = (y*max_size + x) * 4;
		sum += data[index];
	}
	
	return sum;
}

function filter() {
	var canvas = document.getElementById('scan');
	var context = canvas.getContext('2d');
	
	for (var i = 0; i < nproj; i++) {
		// Get projection
		var proj = scan.slice(i*max_size, (i+1)*max_size);
		var complexProj = new complex_array.ComplexArray(proj);	
		
		// Fourier transform
		var frequencies = complexProj.FFT();
		var f = [];
		// Filter
		frequencies.map(function (frequency, j, n) {
			var w = selected_filter.func(j, n);
			frequency.real *= w;
			frequency.imag *= w;
		});	
		
		// Back transform
		var filteredProj = frequencies.InvFFT();
		filteredProj.map(function (v, j, n) {
			scan[i*max_size + j] = v.real;
		});
	}
	
	drawSinogram(nproj);
}

function draw(arr, mul=50, reset=true) {
	var canvas = document.getElementById('scan');
	var context = canvas.getContext('2d');
	
	if (reset === true) {
		context.rect(0, 0, max_size, max_size);
		context.fillStyle = 'white';
		context.fill();
	}
	
	var b = 100;
	
	context.beginPath();
	context.moveTo(0, b);
	arr.map(function (v, i, n) {
		context.lineTo(i, b - v * mul);
	});
	context.stroke();
}

function interpolate(array, w, h, x, y) {
	var intX = parseInt(x);
	var intY = parseInt(y);
	
	var a1 = array[intY*w + intX];
	var a2 = array[intY*w + intX + 1];
	var b1 = array[intY*w + intX + w];
	var b2 = array[intY*w + intX + w + 1];
	
	var c1 = a1 + (a2 - a1) * (x - intX);
	var c2 = b1 + (b2 - b1) * (x - intX);
	
	return c1 + (c2 - c1) * (y - intY);
}

function rotate(array, w, h, angle) {
	newArr = new Float64Array(w*h);
	
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var w2 = w/2;
	var h2 = h/2;
	for (var y = 0; y < h-1; y++) {
		for (var x = 0; x < w-1; x++) {
			var u = (x-w2)*c - (y-h2)*s + w2;
			var v = (x-w2)*s + (y-h2)*c + h2;
			
			if (0 < u && u < w-1 && 0 < v && v < h-1) {
				newArr[y*w + x] = interpolate(array, w, h, u, v);
			} else {
				newArr[y*w + x] = 0;
			}
		}
	}
	
	return newArr;
}

function sum(arr1, arr2) {
	for (var k = 0; k < arr1.length; k++) {
		arr1[k] += arr2[k];	
	}
}

function rec(i, rst, canvas) {
	var show_bp = document.getElementById("show_backprojection").checked;
	
	if (i < nproj) {
		var tmp = new Float64Array(max_size * max_size);
		tmp.map(function (v) { v = 0; });
	
		// Get projection
		var proj = scan.slice(i*max_size, (i+1)*max_size);
		
		for (var j = 0; j < max_size; j++) {
			for (var k = 0; k < max_size; k++) {
				tmp[j*max_size + k] = proj[k];
			}
		}
		
		var angle = Math.PI * i / nproj;
		//drawFromData(tmp, max_size, max_size, 'back');
		tmp = rotate(tmp, max_size, max_size, angle);
		sum(rst, tmp);
	
		var progress = document.getElementById('progress');
		progress.value = i+1;
		
		if (show_bp) {
			drawFromData(rst, max_size, max_size, canvas);
		}
		
		setTimeout(function () { rec(i+1, rst, canvas); }, 0);
	} else {
		drawFromData(rst, max_size, max_size, canvas);
	}
}

function backproject() {
	var progress = document.getElementById('progress');
	progress.max = nproj;
	progress.value = 0;
	
	var canvas = createBackCanvas();
	var context = canvas.getContext('2d');
	
	var rst = new Float64Array(max_size * max_size);
	rst.map(function (v) { v = 0; });
	
	rec(0, rst, canvas);
}

function loadSinogram(e) {
    var file = e.target.files[0];
	
	var reader = new FileReader();
	
	reader.onload = function (e) {
		var canvas = document.getElementById('scan');
		var context = canvas.getContext('2d');
		
		context.rect(0, 0, max_size, max_size);
		context.fillStyle = 'black';
		context.fill();
		
		var image = new Image();
  		image.src = e.target.result;
  		image.onload = function () {
			var w = image.width;
			var h = image.height;

			var nw, nh;
			if (w > max_size) {
				nw = max_size;
				nh = h / w * max_size;
			} else {
				nw = w;
				nh = h;			
			}

			canvas.height = nh;

			var sx = (max_size - nw) / 2;
			
			context.drawImage(this, sx, 0, nw, nh);
			blackWhite(context, max_size);

            var imgData = context.getImageData(0, 0, max_size, nh);	

			nproj = nh;
	        scan = new Float64Array(max_size * nproj);
	        var proj = document.getElementById('projections');
            proj.value = nproj;

            for (var i = 0; i < nproj; i++) {
                for (var j = 0; j < max_size; j++) {
                    var index = (i*max_size + j);
                    
                    scan[index] = imgData.data[index*4];
                }
            }
		}
	};
	
	reader.readAsDataURL(file);

}
