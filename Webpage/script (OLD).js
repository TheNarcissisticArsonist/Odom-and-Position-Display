var ws;
var canvas;
var context;
var currentPosition = [0, 0];
var positionOffset = [0, 0];
var lastPosition = [0, 0];
var canvasImageWithoutOdometry;

function setup() {
	canvas = document.getElementById("mainCanvas");
	context = canvas.getContext("2d");
	context.fillStyle = "white";
	canvasImageWithoutOdometry = context.getImageData(0, 0, canvas.width, canvas.height);
	var horizontalTransform = Number(canvas.getAttribute("width").slice(0, -2))/2;
	var verticalTransform = Number(canvas.getAttribute("height").slice(0, -2))/2;
	context.transform(1, 0, 0, 1, horizontalTransform, verticalTransform);
	context.moveTo(0, 0);
	context.beginPath();

	dataArea = document.getElementById("dataPrintout");

	ws = new WebSocket("ws://127.0.0.1:12345/");
	ws.onmessage = function(event) {
		//console.log(event.data);
		mainLoop(event.data);
	}
	ws.onopen = function() {
		console.log("Connection opened.");
		sendDataRequest();
	}
}
function mainLoop(data) {
	formatted = formatRawMessage(data);
	//console.log(formatted);
	if(formatted.length == 46) {
		//Get the position and quaternion from the formatted data array
		position = [formatted[10], formatted[11], formatted[12]];
		quaternion = [formatted[14], formatted[15], formatted[16], formatted[17]];
		
		//console.log(position);
		//console.log(quaternion);

		for(var i=0; i<position.length; ++i) {
			position[i] = Number(position[i].slice(2));
		}
		for(var i=0; i<quaternion.length; ++i) {
			quaternion[i] = Number(quaternion[i].slice(2));
		}

		//var part1 = "["+position[0]+", "+position[1]+", "+position[2]+"] ";
		//var part2 = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
		//var part3 = "["+quaternion[0]+", "+quaternion[1]+", "+quaternion[2]+", "+quaternion[3]+"]<br>";
		//dataArea.innerHTML = part1 + part2 + part3 + dataArea.innerHTML;
		
		//console.log(position);
		//console.log(quaternion);
		//document.body.innerHTML = String(position) + "\n" + String(quaternion) + "\n" + document.body.innerHTML;

		currentPosition[0] = position[0];
		currentPosition[1] = position[1];

		/*roll*/ var theta = Math.PI-Math.atan2(2*((quaternion[0]*quaternion[1])+(quaternion[2]*quaternion[3])), 1-(2*((quaternion[1]*quaternion[1])+(quaternion[2]*quaternion[2]))));
		/*pitch*/ //var theta = Math.asin(2*((quaternion[0]*quaternion[2])-(quaternion[3]*quaternion[1])));
		/*yaw*/ //var theta = Math.atan2(2*((quaternion[0]*quaternion[3])+(quaternion[1]*quaternion[2])), 1-(2*((quaternion[2]*quaternion[2])+(quaternion[3]*quaternion[3]))));
		unitVector1 = [Math.cos(theta+(Math.PI/16)), Math.sin(theta+(Math.PI/16))];
		unitVector2 = [Math.cos(theta-(Math.PI/16)), Math.sin(theta-(Math.PI/16))];

		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.restore();

		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.putImageData(canvasImageWithoutOdometry, 0, 0);
		context.restore();

		context.beginPath();

		context.moveTo((lastPosition[0]-positionOffset[0]) * 100, (lastPosition[1]-positionOffset[1]) * -100);
		context.lineTo((currentPosition[0]-positionOffset[0]) * 100, (currentPosition[1]-positionOffset[1]) * -100);
		context.stroke();

		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);
		canvasImageWithoutOdometry = context.getImageData(0, 0, canvas.width, canvas.height);
		context.restore();

		context.moveTo((10+(currentPosition[0]-positionOffset[0]) * 100), (currentPosition[1]-positionOffset[1]) * -100)
		context.arc((currentPosition[0]-positionOffset[0]) * 100, (currentPosition[1]-positionOffset[1]) * -100, 10, 0, 2*Math.PI);
		context.stroke();
		context.fill();

		context.moveTo((currentPosition[0]-positionOffset[0]) * 100, (currentPosition[1]-positionOffset[1]) * -100);
		context.lineTo(((currentPosition[0]-positionOffset[0]) * 100)+(10*unitVector1[0]), ((currentPosition[1]-positionOffset[1]) * -100)+(10*unitVector1[1]));
		context.stroke();
		context.moveTo((currentPosition[0]-positionOffset[0]) * 100, (currentPosition[1]-positionOffset[1]) * -100);
		context.lineTo(((currentPosition[0]-positionOffset[0]) * 100)+(10*unitVector2[0]), ((currentPosition[1]-positionOffset[1]) * -100)+(10*unitVector2[1]));
		context.stroke();

		lastPosition[0] = currentPosition[0];
		lastPosition[1] = currentPosition[1];

		//window.setTimeout(sendDataRequest, 100);
		requestAnimationFrame(sendDataRequest);
	}
	else {
		console.log("Improper data received!");
		console.log(data);
	}
}

function sendDataRequest() {
	ws.send("ready");
}
function formatRawMessage(raw) {
	var refined = raw.split("\n");
	for(var i=0; i<refined.length; ++i) {
		refined[i] = refined[i].replace(/\s/g, ""); //Remove every space in each array item by replacing it with nothing
	}
	return refined;
}
function reset() {
	positionOffset[0] = currentPosition[0];
	positionOffset[1] = currentPosition[1];

	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
	canvasImageWithoutOdometry = context.getImageData(0, 0, canvas.width, canvas.height);
	context.restore();
	context.beginPath();

	context.moveTo(0, 0);

}