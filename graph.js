function Graph(parent, w, h)
{
	this.w = w;
	this.h = h;
	
	this.canvas = document.createElement('canvas');
	this.canvas.width = w;
	this.canvas.height = h;
	this.context = this.canvas.getContext('2d');
	
	if (typeof parent == 'string') {
		this.parent = document.getElementById(parent);
	} else {
		this.parent = parent;
	}
	
	parent.insertBefore(this.canvas, null);
}

Graph.prototype.setViewport = function (x, y, w, h)
{
	this.vx = x;
	this.vy = y;
	this.vw = w;
	this.vh = h;
};

Graph.prototype.convertCoord = function (x, y)
{
	var rx = x - this.vx;
	var ry = y - this.vy;
	
	/*if (rx < 0 || rx > this.vw || ry < 0 || ry > this.vh) {
		return null;	
	}*/
	
	var px = rx * this.w/this.vw;
	var py = this.h - ry * this.h/this.vh;
	
	return [px, py];
};

Graph.prototype.plot = function (xs, ys, c)
{
    if (c === undefined) c = '#f00';

	this.context.beginPath();
	this.context.strokeStyle = c;
	
	var _this = this;
	xs.map(function (x, i, n) {
		var y = ys[i];
		
		if (i == 0) {
			_this.context.moveTo(..._this.convertCoord(x, y));
		} else {
			_this.context.lineTo(..._this.convertCoord(x, y));
		}
	});
	
	this.context.stroke(); 
};

Graph.prototype.clear = function (c)
{
    if (c === undefined) c = '#fff';

	this.context.fillStyle = c;
	this.context.fillRect(0, 0, this.w, this.h);
};

function linspace(from, to, num)
{
    if (num === undefined) num = 50;

	var step = (to - from) / num;
	var arr = [];
	
	for (var v = from, i = 0; i <= num; v += step, i++) {
		arr.push(v);
	}
	
	return arr;
}
