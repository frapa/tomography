selected_filter = null;
filter_options = [
	{
		name: 'Ramp',
		plot_func: Math.abs,
		func: (j, n) => Math.abs((j > n/2) ? (2 - j*2 / n) : (j*2 / n))
	},
	{
		name: 'None',
		plot_func: x => 1,
		func: (j, n) => 1
	},
	{
		name: 'Shepp-Logan',
		plot_func: x => Math.abs(2*Math.sin(x*Math.PI/2)/Math.PI),
		func: (j, n) => Math.abs(2*Math.sin(j*Math.PI/n)/Math.PI)
	}
]

max_size = 400;

function init()
{
	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList) {
		
	} else {
		alert('This script is not supported by your browser. I recommend using another browser.');
	}
	
    if (window.innerHeight < 900) {
        max_size = 300;
	    
        var canvas = document.getElementById('preview');
        canvas.width = 300;
        canvas.height = 300;

        var canvas = document.getElementById('scan');
        canvas.width = 300;
        canvas.height = 300;
    }

	var bpdiv = document.getElementById('backprojections');
	bpdiv.style.width = bpdiv.clientWidth + 'px';

    window.onresize = function ()
    {
	    var bptd = document.getElementById('backprojections_td');
        bpdiv.style.width = bptd.clientWidth + 'px'
    }

    bpdiv.style.height = (max_size + 20) + 'px';
	
	initFilters();
}

function initFilters()
{
	var filterDiv = document.getElementById('filters');
	filterDiv.onclick = filterSelect;
	
	filter_options.forEach(function (option)
	{
		var div = document.createElement('div');
		div.className = 'option';
		
		if (option.name == 'Ramp') {
			div.className += ' selected';
			selected_filter = option;
		}
		
		var span = document.createElement('span');
		span.innerHTML = option.name;
		
		var graph = new Graph(div, filterDiv.clientWidth/2, 50);
		graph.setViewport(-1, 0, 2, 1);
		graph.clear();
		
		var xs = linspace(-1, 1, 20);
		var ys = [];
		xs.forEach(function (x) { ys.push(option.plot_func(x)); });
		graph.plot(xs, ys);
		
		div.insertBefore(span, null);
		filterDiv.insertBefore(div, null);
	});
}

function filterSelect(e)
{
	var filterDiv = document.getElementById('filters');
	filterDiv.className += ' clicked';
	
	var divs = filterDiv.getElementsByTagName('div');
	for (var i = 0; i < divs.length; i++) {
		divs[i].style.display = 'block';
		
		var option = filter_options[i];
		divs[i].onclick = makeCallback(option);
	}
	
	filterDiv.onclick = null;
	e.stopPropagation()
}

function makeCallback(filter) {
	var option = filter;
	
	return function(e_) { filterChoose(e_, option); };
}

function filterChoose(e, filter)
{
	selected_filter = filter;
	
	var filterDiv = document.getElementById('filters');
	filterDiv.className = filterDiv.className.split(' ')[0];
	
	var divs = filterDiv.getElementsByTagName('div');
	for (var i = 0; i < divs.length; i++) {
		divs[i].style.display = '';
		divs[i].className = divs[i].className.split(' ')[0];
		divs[i].onclick = null;
			
		if (filter == filter_options[i]) {
			divs[i].className += ' selected';
		}
	}
	
	filterDiv.onclick = filterSelect;
	e.stopPropagation()
}

function createBackCanvas() {
	var span = document.createElement('span');
    span.className = 'backprojection-container';
	
	var canvas = document.createElement('canvas');
	canvas.className = 'back';
	canvas.width = max_size;
	canvas.height = max_size;

    var optionsOverlay = document.createElement('span');
    optionsOverlay.className = 'option-overlay';

    var close = document.createElement('div');
    close.className = 'overlay-button';
    close.style.backgroundImage = 'url(x.png)';
    close.title = 'Close image';

    close.onclick = function () {
        document.getElementById('backprojections').removeChild(span);
    }

    var save = document.createElement('a');
    save.className = 'overlay-button';
    save.style.backgroundImage = 'url(save.png)';
    save.title = 'Download image';
    
    save.download = 'backprojection.png';
    save.onclick = function () {
        save.href = canvas.toDataURL();
    }

    optionsOverlay.insertBefore(close, null);
    optionsOverlay.insertBefore(save, null);

    span.insertBefore(canvas, null);
    span.insertBefore(optionsOverlay, null);
	
	document.getElementById('backprojections').insertBefore(span, null);
	
	return canvas;
}

function saveSinogram(e) {
    var canvas = document.getElementById('scan');
    e.target.href = canvas.toDataURL();
}

function toggle(id) {
    var checkbox = document.getElementById(id);
    checkbox.checked = !checkbox.checked;
}
