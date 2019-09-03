const channelId = "37802193";
const actionTime = 10000;
let clicks = [];

const canvas = document.querySelector("#heatmap");
const ctx = canvas.getContext("2d");

const socket = require('socket.io-client')('http://heat-ebs.j38.net/');
const robot = require("robotjs");

socket.on('connect', () => {
    console.log("connected");
    socket.emit("channel", channelId);
});

socket.on('click', data => {
    data = JSON.parse(data);
    const click = clicks.find(c => c.id == data.id);
    if (click) {
        click.x = data.x;
        click.y = data.y;
    } else {
        clicks.push(data);
    }
});

socket.on('disconnect', () => {
    console.log("disconnected")
});

const getDemocraticPoint = (radius = 0.01) => {
    if(clicks.length == 0){
        return null;
    }

    clicks.forEach(c => c.weight = 1);

    for (let i = 0; i < clicks.length; i++) {
        for (let j = i + 1; j < clicks.length; j++) {
            if (Math.sqrt(Math.pow(clicks[i].x - clicks[j].x, 2) + Math.pow(clicks[i].y - clicks[j].y, 2)) < radius * 2) {
                clicks.push({
                    x: (clicks[i].x + clicks[j].x) / 2,
                    y: (clicks[i].y + clicks[j].y) / 2,
                    weight:clicks[i].weight + clicks[j].weight
                });
            }
        }
    }

    clicks = clicks.sort((a, b) => b.weight - a.weight);
    return clicks[0];
}

let lastAction = Date.now();
const step = () => {
    const now = Date.now();
    if (now > lastAction + actionTime) {
        lastAction = now;

        //get point to click
        const point = getDemocraticPoint();
        if(point){
            robot.moveMouseSmooth(100, 100);
            robot.mouseClick();
        }

        //remove clicks
        clicks = [];
    }

    //Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Background
    ctx.fillStyle = "rgb(0, 0, 255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Clicks
    clicks.forEach(click => {
        ctx.fillStyle = "rgba(255, 255, 0, 0.2)";
        ctx.beginPath();
        ctx.arc(click.x * canvas.width, click.y * canvas.height, 20, 0, 2 * Math.PI);
        ctx.fill();
    });

    //Timer
    ratio = (now - lastAction) / actionTime;
    ctx.fillStyle = `rgb(255, ${255 * (1 - ratio)}, 0)`;
    ctx.fillRect(0, 0, canvas.width * ratio, 10);

    requestAnimationFrame(step);
}

requestAnimationFrame(step);


const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize, false);
resize();