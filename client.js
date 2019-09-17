const channelId = "459322521";
const actionTime = 10000;
let clicks = [];

const forbiddenZones = [{ x: 0.96, y: 0, radius: 0.05 }]

const circleRadius = 0.02;

const canvas = document.querySelector("#heatmap");
const ctx = canvas.getContext("2d");

const gameFrame = {
    x: 0.75,
    y: 1
}

const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

var socket = io("http://heat-ebs.j38.net/");

socket.on('connect', () => {
    console.log("connected");
    socket.emit("channel", channelId);
});

socket.on('click', data => {
    data = JSON.parse(data);

    if (data.x > gameFrame.x) {
        return;
    }

    data.double = false;
    data.x *= 1;
    data.y *= 1;

    data.x /= gameFrame.x;

    if (forbiddenZones.find(f => distance(data.x, data.y, f.x, f.y) < f.radius)) {
        return;
    }

    const click = clicks.find(c => c.id == data.id);
    if (click) {
        if (distance(click.x, click.y, data.x, data.y) < 0.01) {
            click.double = true;
        } else {
            click.double = false;
            click.x = data.x;
            click.y = data.y;
        }
    } else {
        clicks.push(data);
    }
});

socket.on('disconnect', () => {
    console.log("disconnected")
});

const getDemocraticPoint = (radius = 0.01) => {
    if (clicks.length == 0) {
        return null;
    }

    clicks.forEach(c => c.weight = 1);

    for (let i = 0; i < clicks.length; i++) {
        for (let j = i + 1; j < clicks.length; j++) {
            if (clicks[i].double == clicks[i].double && distance(clicks[i].x, clicks[i].y, clicks[j].x, clicks[j].y) < radius * 2) {
                clicks[i].weight++;
                clicks[j].weight++;
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

        const point = getDemocraticPoint(circleRadius);
        if (point) {
            fetch(`http://localhost:3000/${(point.x) * gameFrame.x + 0.125}/${point.y}/${point.double ? 1 : 0}`);
        }

        clicks = [];
    }

    //Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Background
    ctx.fillStyle = "rgb(0, 0, 255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //forbidden
    //  forbiddenZones.forEach(click => {
    //     ctx.fillStyle = "rgba(255, 255, 0, 1)";
    //     ctx.beginPath();
    //     ctx.arc(click.x * canvas.width, click.y * canvas.height, canvas.width * click.radius, 0, 2 * Math.PI);
    //     ctx.fill();
    // });

    //Clicks
    clicks.forEach(click => {
        if(click.double){
            ctx.fillStyle = "rgba(255, 0, 0, 1)";
        }else{
            ctx.fillStyle = "rgba(255, 255, 0, 1)";
        }
        ctx.beginPath();
        ctx.arc(click.x * canvas.width, click.y * canvas.height, canvas.width * circleRadius, 0, 2 * Math.PI);
        ctx.fill();
    });

    //Timer
    ratio = (now - lastAction) / actionTime;
    ctx.fillStyle = `rgb(255, ${255 * (1 - ratio)}, 0)`;
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height * ratio);

    requestAnimationFrame(step);
}

requestAnimationFrame(step);


const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize, false);
resize();

window.onload = () => {
    resize();
}