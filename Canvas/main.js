! function function_name(argument) {

	var PIXEL_RATIO = (function() {
		var ctx = document.createElement("canvas").getContext("2d"),
			dpr = window.devicePixelRatio || 1,
			bsr = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;

		return dpr / bsr;
	})();


	function createHiDPICanvas(w, h, ratio) {
		if (!ratio) {
			ratio = PIXEL_RATIO;
		}
		var can = document.createElement("canvas");
		can.width = w * ratio;
		can.height = h * ratio;
		can.style.width = w + "px";
		can.style.height = h + "px";
		can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
		return can;
	}

	function getViewPortSize(){
		var w = window,
	    d = document,
	    e = d.documentElement,
	    g = d.getElementsByTagName('body')[0],
	    x = w.innerWidth || e.clientWidth || g.clientWidth,
	    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

	    return {
	    	"x": x,
	    	"y": y
	    };
	}

	var viewportSize = getViewPortSize();


	//Create canvas with the device resolution.
	//var canvas = document.getElementById('canvas');
	var canvas = createHiDPICanvas(viewportSize.x, viewportSize.y);

	if (canvas.getContext) {
		var ctx = canvas.getContext('2d');

		ctx.imageSmoothingEnabled = true;

		// drawing code here
		ctx.fillStyle = "rgb(200,0,0)";
		ctx.fillRect(30, 30, 55, 50);

		ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
		ctx.fillRect(50, 50, 55, 50);

		ctx.clearRect(60, 60, 10, 10);

		ctx.strokeStyle = "rgb(0, 200, 0)";
		ctx.strokeRect(10.5, 10.5, 120, 120);

		ctx.strokeStyle = "#000";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(140, 5);
		ctx.lineTo(140, 200);
		ctx.lineTo(200, 208);
		ctx.stroke();

		ctx.font = "20px Arial";
		ctx.fillStyle = "Black";
		ctx.fillText("Sample String", 5, 250);
	} else {
		// canvas-unsupported code here
	}

	var parent = document.getElementById("canvas-container");
	parent.appendChild(canvas);
}()