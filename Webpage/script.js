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

function setup() {
	canvas = document.getElementById("mainCanvas");
	context = canvas.getContext("2d");
	var horizontalTransform = Number(canvas.getAttribute("width").slice(0, -2))/2;
	var verticalTransform = Number(canvas.getAttribute("height").slice(0, -2))/2;
	context.transform(1, 0, 0, 1, horizontalTransform, verticalTransform);

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