const express = require("express")
const app = express()
const robot = require("robotjs");
const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Range, Accept-Range");
    res.header("Access-Control-Expose-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Range, Accept-Range");
    next();
});

let toggle = true;

app.get("/toggle", function (req, res) {
    toggle = !toggle;
    res.send(toggle);
});

app.post("/", (req, res) => {
    if (!toggle) {
        return;
    }

    if (!req.body.actions) {
        return;
    }


    req.body.actions.forEach(action => {
        let params = {
            x: 0,
            y: 0,
            button: "left",
            double: false,
            down: "down",
        }

        Object.assign(params, action);

        switch (action.action) {
            case "moveMouse":
                robot.moveMouse(params.x * robot.getScreenSize().width, params.y * robot.getScreenSize().height);
                break;
            case "moveMouseSmooth":
                robot.moveMouseSmooth(params.x * robot.getScreenSize().width, params.y * robot.getScreenSize().height);
                break;
            case "mouseClick":
                robot.mouseClick(params.button, params.double);
                break;
            case "mouseToggle":
                robot.mouseToggle(params.down, params.button);
                break;
            case "dragMouse":
                robot.dragMouse(params.x * robot.getScreenSize().width, params.y * robot.getScreenSize().height);
                break;
        }
    });


    res.status(200).json(req.body);
});

app.listen(3000, () => {
    console.log('ROBOTJS')
})
