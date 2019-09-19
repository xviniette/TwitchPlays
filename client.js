const CHANNEL_ID = "459322521";
const GAME_FRAME = {
    x: 0,
    y: 0,
    width: 0.75,
    height: 1
}
const AFK_TIME = 3 * 60 * 1000;
const FORBIDDEN_ZONES = [{ x: 0.96, y: 0, radius: 0.05 }];
const ACTION_TIME = 7000;

let CLICKS = [];
const CLICK_RADIUS = 0.02;
const DBCLICK_RADIUS = 0.01;

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const distance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

//WEBSOCKET
var socket = io("http://heat-ebs.j38.net/");

socket.on("connect", () => {
    socket.emit("channel", CHANNEL_ID);
});

socket.on("click", data => {
    data = JSON.parse(data);

    //GAME FRAME
    if (data.x < GAME_FRAME.x) {
        return;
    }
    if (data.x > GAME_FRAME.x + GAME_FRAME.width) {
        return;
    }
    if (data.y < GAME_FRAME.y) {
        return;
    }
    if (data.y > GAME_FRAME.y + GAME_FRAME.height) {
        return;
    }

    data.x *= 1;
    data.y *= 1;
    data.dbclick = false;

    data.x /= GAME_FRAME.width;
    data.y /= GAME_FRAME.height;

    //FORBIDDEN
    if (FORBIDDEN_ZONES.find(f => distance(data.x, data.y, f.x, f.y) < f.radius)) {
        return;
    }

    //USER CLICK
    const click = CLICKS.find(c => c.id == data.id);
    if (click) {
        if (distance(click.x, click.y, data.x, data.y) < DBCLICK_RADIUS) {
            click.dbclick = true;
        } else {
            click.x = data.x;
            click.y = data.y;
            click.dbclick = false;
        }
    } else {
        CLICKS.push(data);
    }
});

const getCommunityClick = () => {
    if (CLICKS.length == 0) {
        return null;
    }

    CLICKS.forEach(c => c.weight = 1);

    for (let i = 0; i < CLICKS.length; i++) {
        for (let j = i + 1; j < CLICKS.length; j++) {
            if (CLICKS[i].dbclick == CLICKS[j].dbclick && distance(CLICKS[i].x, CLICKS[i].y, CLICKS[j].x, CLICKS[j].y) < CLICK_RADIUS * 2) {
                CLICKS[i].weight++;
                CLICKS[j].weight++;
            }
        }
    }

    CLICKS = CLICKS.sort((a, b) => b.weight - a.weight);
    return CLICKS[0];
}

const sendActions = (actions = []) => {
    fetch("http://localhost:3000/", {
        method: "POST",
        body: JSON.stringify({ actions }),
        headers: { 'Content-type': 'application/json' }
    });
}

let lastAction = Date.now();
let lastClick = Date.now();
const update = () => {
    const now = Date.now();
    if (now > lastAction + ACTION_TIME) {
        lastAction = now;

        const click = getCommunityClick();
        if (click) {
            sendActions([
                {
                    action: "moveMouseSmooth",
                    x: click.x * GAME_FRAME.width + 0.125,
                    y: click.y
                },
                {
                    action: "mouseClick",
                    double: click.dbclick
                },
                {
                    action: "moveMouse",
                    x: 0.46,
                    y: 0.92
                }
            ]);


            lastClick = Date.now();
        } else {
            if (now > lastClick + AFK_TIME) {

                sendActions([
                    {
                        action: "moveMouseSmooth",
                        x: Math.random() * 0.2 + 0.4,
                        y: Math.random() * 0.2 + 0.4
                    },
                    {
                        action: "mouseClick",
                    }
                ]);

                lastClick = Date.now();
            }
        }

        CLICKS = [];
    }

    //CLEAR
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //CLICKS
    ctx.globalCompositeOperation = "multiply";
    CLICKS.forEach(click => {
        if (click.dbclick) {
            ctx.fillStyle = "rgb(255, 191, 184)";
        } else {
            ctx.fillStyle = "rgb(255, 242, 184)";
        }
        ctx.beginPath();
        ctx.arc(click.x * canvas.width, click.y * canvas.height, canvas.width * CLICK_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    });

    //TIMER
    ratio = (now - lastAction) / ACTION_TIME;
    ctx.fillStyle = `rgb(255, ${255 * (1 - ratio)}, 0)`;
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height * ratio);

    requestAnimationFrame(update);
}


const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize, false);

window.onload = () => {
    resize();
    update();
}