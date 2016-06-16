/*
//This splits the message into an array of usable pieces, and gets rid of all the whitespace
function formatMessage(raw) {
	var refined = raw.split("\n");
	for(var i=0; i<refined.length; ++i) {
		refined[i] = refined[i].replace(/\s/g, ""); //Remove every space in each array item by replacing it with nothing
	}
	console.log(refined);
	return refined;
}*/

var ws;
var canvas;
var context;
var currentPosition = [0, 0];
var positionOffset = [0, 0];

function setup() {
	canvas = document.getElementById("mainCanvas");
	context = canvas.getContext("2d");
	var horizontalTransform = Number(canvas.getAttribute("width").slice(0, -2))/2;
	var verticalTransform = Number(canvas.getAttribute("height").slice(0, -2))/2;
	context.transform(1, 0, 0, 1, horizontalTransform, verticalTransform);
	context.moveTo(0, 0);
	context.beginPath();

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

		console.log(position);
		console.log(quaternion);
		//document.body.innerHTML = String(position) + "\n" + String(quaternion) + "\n" + document.body.innerHTML;

		currentPosition[0] = position[0];
		currentPosition[1] = position[1];

		context.lineTo((position[0]-positionOffset[0]) * 100, (position[1]-positionOffset[1]) * -100);
		context.stroke();

		sendDataRequest();
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
	context.restore();
	context.beginPath();

	context.moveTo(0, 0);
}