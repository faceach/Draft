!function function_name (argument) {
	var canvas = document.getElementById('canvas');
	if (canvas.getContext){
		var ctx = canvas.getContext('2d');
		// drawing code here
		ctx.fillStyle = "rgb(200,0,0)";
		ctx.fillRect(30, 30, 55, 50);

		ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
		ctx.fillRect(50, 50, 55, 50);

		ctx.clearRect(60, 60, 10, 10);

		ctx.strokeStyle = "rgb(0, 200, 0)";
		ctx.strokeRect(10.5, 10.5, 120, 120);

		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
	    ctx.beginPath();
	    ctx.moveTo(140, 5);
	    ctx.lineTo(140, 200);
	    ctx.lineTo(200, 208);
	    ctx.stroke();
	} else {
		// canvas-unsupported code here
	}
}()
