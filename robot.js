const express = require('express')
const app = express()
const robot = require("robotjs");

let toggle = true;

app.get('/:x/:y/:dbclick?', function (req, res) {
    if (toggle) {
        robot.moveMouseSmooth(req.params.x * robot.getScreenSize().width, req.params.y * robot.getScreenSize().height);
        robot.mouseClick("left", req.params.dbclick == "1" ? true : false);
    }
    res.send();
});

app.get('/toggle', function (req, res) {
    toggle = !toggle;
    res.send(toggle);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})
