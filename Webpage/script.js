//Create a WebSocket object, on localhost (127.0.0.1) port 12345
//The ws:// is just like http:// or file://
var ws = new WebSocket("ws://127.0.0.1:12345/");

//Define a function to be executed when a message is received
ws.onmessage = function (event) {
    var message = formatMessage(event.data); //Store the message data to a variable
    //document.body.innerHTML = message + "<br>" + document.body.innerHTML; //Add it to the top of the webpage
};

function sendDataRequest() {
	ws.send("ready");
	requestAnimationFrame(sendDataRequest);
}

ws.onopen = function() {
	requestAnimationFrame(sendDataRequest); //This is to help keep the browser from getting lost and hanging
}

//This splits the message into an array of usable pieces, and gets rid of all the whitespace
function formatMessage(raw) {
	var refined = raw.split("\n");
	for(var i=0; i<refined.length; ++i) {
		refined[i] = refined[i].replace(/\s/g, ""); //Remove every space in each array item by replacing it with nothing
	}
	console.log(refined);
	return refined;
}