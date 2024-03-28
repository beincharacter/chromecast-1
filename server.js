const express = require("express");
const bodyParser = require("body-parser");
var ccast = require('./index.js');

const app = express();

app.use(bodyParser.json());
var deviceList  = ccast.fn1().showDevices();

const devicesList = (req, res) => {
  if(deviceList){
    res.send(deviceList);
  }
};
app.get("/devicesList", devicesList);



const castDevice = (req, res) => {
  ccast.fn1().CastDevice(req);
  res.send({status:201});
};
app.post("/castDevice", castDevice);
app.listen(80, () => {
  console.log(`Server is running on port 80.`);
});

 