const channelId = "37802193";

const socket = require('socket.io-client')('http://heat-ebs.j38.net/');
socket.on('connect', () => {
    console.log("connected");
    socket.emit("channel", channelId);
});
socket.on('click', data => {
    console.log(data);
});
socket.on('disconnect', function(){});
 
// var robot = require("robotjs");

// // Speed up the mouse.
// robot.setMouseDelay(2);

// var twoPI = Math.PI * 2.0;
// var screenSize = robot.getScreenSize();
// var height = (screenSize.height / 2) - 10;
// var width = screenSize.width;

// for (var x = 0; x < width; x++)
// {
// 	y = height * Math.sin((twoPI * x) / width) + height;
// 	robot.moveMouse(x, y);
// }
