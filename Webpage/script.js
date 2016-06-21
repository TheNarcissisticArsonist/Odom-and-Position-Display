var webSocketIP = "127.0.0.1"; //The IP of the websocket server.
var webSocketPort = "12345"; //The port the websocket is being served on.
var webSocketPath = "/"; //The file path of the websocket.
var formattedDataStringStandardArrayLength = 46; //The expected length of the formatted data string from formatRawMessage().
var formattedDataStringPositionIndeces = [10, 11, 12]; //The location of the xyz position data in the formatted data string.
var formattedDataStringQuaternionIndeces = [14, 15, 16, 17]; //The location of the xyzw quaternion data in the formatted data string.
var eulerAngleUsed = 0; //Due to some weirdness with the robot's orientation data, the Euler angle for the XY-plane can be unexpected.
						//0 is roll, 1 is pitch, 2 is yaw.
var robotMarkerRadius = 0.3; //The radius of the circle that marks the robot's location, in meters.
var robotMarkerArrowAngle = Math.PI/6; //There's an arrow on the circle, showing which direction the robot is pointing. This is the angle between the centerline and one of the sides.

pointsRecord = []; //This record the list of 2D point where the robot has been, so the program can draw lines between them.
scaleFactor = 100; //As the path and information get bigger, it's useful to zoom out.
positionOffset = [0, 0]; //This is used to keep the robot's location on the screen centered.
pathMaxLength = Infinity; //If the program ever starts to get slow, this can be used to begin erasing points from the beginning of the path.
						  //I'll set it to something once I find that point.

function setup() { //Call this to get the program going.
	canvas = document.getElementById("mainCanvas"); //Grab the HTMl of the canvas.
	canvas.style.transform = "matrix(0, -1, 1, 0, 0, 0)"; //Rotate the canvas so up is forward, like in a map.
	context = canvas.getContext("2d"); //All canvas drawings are done through a context.
	context.fillStyle = "white"; //Set the fill style of closed shapes on the canvas to white.
	context.beginPath(); //This starts a path so lines can be drawn.

	dataArea = document.getElementById("dataPrintout"); //As the program receives data, this area on the webpage can be used to record it.
	updateZoomButton = document.getElementById("updateZoom"); //Click this to update the zoom factor to contain the whole path.
	updateZoomButton.addEventListener("click", updateZoom);

	ws = new WebSocket("ws://"+webSocketIP+":"+webSocketPort+webSocketPath); //This creates the websocket object.
	ws.onmessage = function(event) { //When a message is received...
		//console.log(event.data);
		mainLoop(event.data); //Go into the main loop and use the data.
	}
	ws.onopen = function() {
		console.log("Connection opened.");
		sendDataRequest(); //Send a request for data once the connection is opened.
	}
}
function mainLoop(data) {
	formatted = formatRawMessage(data); //This takes the raw data sent through the websocket, and converts it into something that's a bit easier to use.
	//console.log(formatted);

	if(formatted.length == formattedDataStringStandardArrayLength) { //The formatted data should be an array with 46 units. If the array is a different length, something is wrong.
		//Store the x, y, and z position in a separate variable.
		positionXYZ = [formatted[formattedDataStringPositionIndeces[0]], formatted[formattedDataStringPositionIndeces[1]], formatted[formattedDataStringPositionIndeces[2]]];

		//Store the x, y, z, and w quaternion in a separate variable.
		quaternionXYZW = [formatted[formattedDataStringQuaternionIndeces[1]], formatted[formattedDataStringQuaternionIndeces[0]], formatted[formattedDataStringQuaternionIndeces[2]], formatted[formattedDataStringQuaternionIndeces[3]]];

		//Unfortunately, there's still more formatting to be done.
		//The data entries stored in positionXYZ and quaternionXYZW are stored as strings, and have a bit before the number (e.g. "x:####").
		//The "x:" part is removed by slicing from the character in position 2, and then the Number() function is called to convert the string to a useable number.

		for(var i=0; i<positionXYZ.length; ++i) { //Format positionXYZ.
			positionXYZ[i] = Number(positionXYZ[i].slice(2));
		}
		for(var i=0; i<quaternionXYZW.length; ++i) { //Format quaternionXYZW.
			quaternionXYZW[i] = Number(quaternionXYZW[i].slice(2));
		}

		var eulerAngles = quaternionToEuler(quaternionXYZW); //Convert the quaternion to euler angles.
		var theta = eulerAngles[eulerAngleUsed]; //This is the XY-plane angle actually used, rotated 90 degrees so that forward is up instead of right.

		pointsRecord.push([positionXYZ[0], positionXYZ[1]]); //Store the next point to the list.

		context.lineWidth = 1/scaleFactor; //Make sure the lines don't freak out.

		context.setTransform(1, 0, 0, 1, 0, 0); //Reset all transforms on the context.
		context.clearRect(0, 0, canvas.width, canvas.height); //Clear the canvas.
		context.transform(1, 0, 0, 1, canvas.width/2, canvas.height/2); //Put 0, 0 in the center of the canvas.
		context.transform(scaleFactor, 0, 0, scaleFactor, 0, 0); //Scale the canvas.
		context.transform(1, 0, 0, -1, 0, 0); //Flip the canvas so y+ is up.

		context.beginPath();
		context.arc(0, 0, robotMarkerRadius, 0, 2*Math.PI); //This will draw a circle around the center for the robot marker.
		context.stroke();

		//These lines draw a triangle inside the circle, to show the direction of the robot.
		context.beginPath();
		context.moveTo(robotMarkerRadius*Math.cos(0), robotMarkerRadius*Math.sin(0));
		context.lineTo(robotMarkerRadius*Math.cos(Math.PI-robotMarkerArrowAngle), robotMarkerRadius*Math.sin(Math.PI-robotMarkerArrowAngle));
		context.stroke();
		context.moveTo(robotMarkerRadius*Math.cos(0), robotMarkerRadius*Math.sin(0));
		context.lineTo(robotMarkerRadius*Math.cos(Math.PI-robotMarkerArrowAngle), -robotMarkerRadius*Math.sin(Math.PI-robotMarkerArrowAngle));
		context.stroke();
		context.moveTo(robotMarkerRadius*Math.cos(Math.PI-robotMarkerArrowAngle), robotMarkerRadius*Math.sin(Math.PI-robotMarkerArrowAngle));
		context.lineTo(robotMarkerRadius*Math.cos(Math.PI-robotMarkerArrowAngle), -robotMarkerRadius*Math.sin(Math.PI-robotMarkerArrowAngle));
		context.stroke();

		context.transform(Math.cos(-theta), Math.sin(-theta), -Math.sin(-theta), Math.cos(-theta), 0, 0); //Orient the path behind the robot properly.
		context.moveTo(pointsRecord[0][0]-positionXYZ[0], pointsRecord[0][1]-positionXYZ[1]); //Move to the first point in the path.
		context.beginPath();
		for(var i=1; i<pointsRecord.length; ++i) { //This draws lines from point i to point i-1
			context.lineTo(pointsRecord[i][0]-positionXYZ[0], pointsRecord[i][1]-positionXYZ[1]); //Draw a line to the next point.
			context.stroke();
		}

		window.setTimeout(sendDataRequest, 100);
		//requestAnimationFrame(sendDataRequest);
	}
	else { //Ok, so there's a problem with the data...
		console.log("Improper data received!"); //Tell me wtf is going on.
		console.log(data); //Print if out.
		requestAnimationFrame(sendDataRequest); //Try again, to see if it gets better.
	}
}

function sendDataRequest() {
	ws.send("ready");
	//When this message is sent, the server knows that the webpage is ready to process more data.
	//The server will then proceed to send the most recent data avaiable.
}
function formatRawMessage(raw) { //This takes the raw message and formats it in a way that the data can be accessed more easily.
	var refined = raw.split("\n"); //The data sent by the websocket has lots of newline characters -- every single piece of data is on its own line. This splits it apart into an array.
	for(var i=0; i<refined.length; ++i) { //Now, for each item that was split apart...
		refined[i] = refined[i].replace(/\s/g, ""); //Remove all the whitespace by replacing spaces with (quite literally) nothing.
	}
	return refined; //Spit it back at me.
}
function quaternionToEuler(quat) { //This takes the quaternion array [x, y, z, w] and returns the euler array [φ, θ, ψ]
	//The quaternion describes the orientation and rotation of the robot, but it's very complicated.
	//These formulas convert the XYZW quaternion into φθψ (phi-theta-psi) euler angles.
	//It's easiest to think of them as φ=pitch (index 0), θ=roll (index 1), and ψ=yaw (index 2).
	//These formulas were taken from https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Euler_Angles_from_Quaternion

	euler = [];
	euler[0] = Math.atan2(2*((quat[0]*quat[1]) + (quat[2]*quat[3])), 1-(2*((quat[1]*quat[1]) + (quat[2]*quat[2]))));
	euler[1] = Math.asin(2*((quat[0]*quat[2]) - (quat[3]*quat[1])));
	euler[2] = Math.atan2(2*((quat[0]*quat[3]) + (quat[1]*quat[2])), 1-(2*((quat[2]*quat[2]) + (quat[3]*quat[3]))));
	return euler;
}
function updateZoom() {
	var furthestPointIndex = 0;
	var furthestDistance = distance(pointsRecord[0], pointsRecord[pointsRecord.length-1]);
	var maxDistance = (canvas.width/2) - (canvas.width/100);
	for(var i=1; i<pointsRecord.length-1; ++i) {
		currentDistance = distance(pointsRecord[i], pointsRecord[pointsRecord.length-1]);
		if(currentDistance >= furthestDistance) {
			furthestPointIndex = i;
			furthestDistance = currentDistance;
		}
	}
	scaleFactor = maxDistance/furthestDistance;
}
function distance(pointA, pointB) {
	return Math.sqrt(Math.pow(pointB[0]-pointA[0], 2) + Math.pow(pointB[1]-pointA[1], 2));
}