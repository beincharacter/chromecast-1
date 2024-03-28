const {
  RSocketClient,
  JsonSerializer,
  IdentitySerializer,
} = require("rsocket-core");
const RSocketTcpClient = require("rsocket-tcp-client").default;
const nodecastor = require("nodecastor");

const Client = require("castv2-client").Client;
const DefaultMediaReceiver = require("castv2-client").DefaultMediaReceiver;

var client = undefined;

// Create an instance of a client
client = new RSocketClient({
  serializers: {
    data: JsonSerializer,
    metadata: IdentitySerializer,
  },
  setup: {
    // ms btw sending keepalive to server
    keepAlive: 6000000,
    // ms timeout if no keepalive response
    lifetime: 18000000,
    // format of `data`
    dataMimeType: "application/json",
    // format of `metadata`
    metadataMimeType: "message/x.rsocket.routing.v0",
  },
  transport: new RSocketTcpClient({
    host: "192.168.28.11",
    port: 7000,
  }),
});

// Open the connection

client.connect().subscribe({
  onComplete: (socket) => {
    // socket provides the rsocket interactions fire/forget, request/response,
    // request/stream, etc as well as methods to close the socket.
    console.log("====connected=====");
    // console.log(socket)
    socket.fireAndForget({});
    socket
      .requestStream({
        data: {
          streamId: "COMMAND",
          type: "COMMAND",
          component: "COMMAND",
        },
        metadata: "STREAM_REQUEST",
      })
      .subscribe({
        onComplete: () => console.log("complete"),
        onError: (error) => {
          console.log("Error occurred:", error);
          // Handle error and continue
          continueProcessing();
        },
        onNext: (payload) => {
          let DataObj = JSON.parse(payload.data);
          console.log("Triggered data :", DataObj);
          console.log("Cast status : ", DataObj.castStatus);

          if ("StopCast" === DataObj[0].castStatus) {
            console.log("=========inside stop cast=======");
            try {
              stopCastDevice(payload.data);
            } catch (e) {
              console.log("Stop cast error : ", e);
            }
          } else {
            console.log("=========inside cast=======");
            // stopCastDevice(payload.data);
            CastDevice(payload.data);
          }
        },
        onSubscribe: (subscription) => {
          subscription.request(2147483647);
        },
      });
  },
  onError: (error) => {
    console.log("Connection error:", error);
    // Handle error and continue
    continueProcessing();
  },
  onSubscribe: (cancel) => {
    /* call cancel() to abort */
  },
});

// Function to start casting
// function CastDevice(data) {
//   let castdevices = JSON.parse(data);
//   console.log("===data====", castdevices);

//   castdevices.forEach(function (device) {
//     console.log("===device====", device);

//     let deviceName = device.device_name;
//     let host = device.device_ip;
//     let url = device.url;

//     console.log("=host==", host);

//     if (device.x1 && device.x2 && device.y1 && device.y2) {
//       function roundToNearest(number, decimalPlaces) {
//         const factor = Math.pow(10, decimalPlaces);
//         return (Math.round(number * factor) / factor).toFixed(decimalPlaces);
//       }
//       var x1 = parseFloat(device.x1) / 100;
//       var x2 = parseFloat(device.x2) / 100;
//       var y1 = parseFloat(device.y1) / 100;
//       var y2 = parseFloat(device.y2) / 100;

//       var minusX = x2 - x1;
//       var minusY = y2 - y1;

//       var scalex = 1 / minusX;
//       var scalexMinus = scalex - 1;
//       if (scalexMinus === 0) {
//         scalexMinus = 1;
//       }

//       var scaley = 1 / minusY;
//       var scaleyMinus = scaley - 1;
//       if (scaleyMinus === 0) {
//         scaleyMinus = 1;
//       }

//       var originx = ((scalex * x1) / scalexMinus) * 100;
//       var originy = ((scaley * y1) / scaleyMinus) * 100;

//       scalex = roundToNearest(scalex, 0);
//       scaley = roundToNearest(scaley, 0);
//       originx = roundToNearest(originx, 0);
//       originy = roundToNearest(originy, 0);

//       let spltUrl = device["url"].split("?");
//       url =
//         spltUrl[0] +
//         "?" +
//         spltUrl[1] +
//         `&scalex=${scalex}&scaley=${scaley}&originx=${originx}&originy=${originy}&rotate=0` +
//         "&cast=true";

//       console.log("url : ", url);
//     }

//     console.log("url--", url);

//     if (data.device && data.device.casterId) {
//       var timeStamp = new Date().getTime();
//       sendCasterStatus({
//         casterId: data.device.casterId,
//         timestamp: timeStamp,
//         state: "running",
//       });
//     }
//     var device = new nodecastor.CastDevice({
//       friendlyName: deviceName,
//       name: deviceName,
//       address: host,
//     });

//     device.on("connect", () => {
//       device.status((err, status) => {
//         if (err) {
//           console.log(err);
//           return;
//         }
//         console.log("=======status done=======");
//         if (data.device && data.device.casterId) {
//           var timeStamp = new Date().getTime();
//           sendDeviceStatus({
//             casterId: data.device.casterId,
//             chromecastId: device.host,
//             timestamp: timeStamp,
//             state: "success",
//           });
//         }

//         return new Promise(function (resolve, reject) {
//           try {
//             device.application("5CB45E5A", (err, application) => {
//               if (err) {
//                 console.log(err);
//                 return;
//               }
//               application.run("urn:x-cast:com.url.cast", (err, session) => {
//                 if (err) {
//                   console.log(err);
//                   return;
//                 }
//                 session.send({ type: "loc", url: url }, (err, data) => {
//                   console.log(data);
//                   resolve();
//                   return;
//                 });
//               });
//             });
//           } catch (error) {
//             console.log(error);
//             reject(error);
//             return;
//           }
//         });
//       });
//     });
//   });
// }

// Function to start casting
async function CastDevice(data) {
  try {
    let castdevices = JSON.parse(data);

    for (const device of castdevices) {
      console.log("Casting to device:", device.device_name);

      let deviceName = device.device_name;
      let host = device.device_ip;
      let url = device.url;

      

    if (device.x1 && device.x2 && device.y1 && device.y2) {
      function roundToNearest(number, decimalPlaces) {
        const factor = Math.pow(10, decimalPlaces);
        return (Math.round(number * factor) / factor).toFixed(decimalPlaces);
      }
      var x1 = parseFloat(device.x1) / 100;
      var x2 = parseFloat(device.x2) / 100;
      var y1 = parseFloat(device.y1) / 100;
      var y2 = parseFloat(device.y2) / 100;

      var minusX = x2 - x1;
      var minusY = y2 - y1;

      var scalex = 1 / minusX;
      var scalexMinus = scalex - 1;
      if (scalexMinus === 0) {
        scalexMinus = 1;
      }

      var scaley = 1 / minusY;
      var scaleyMinus = scaley - 1;
      if (scaleyMinus === 0) {
        scaleyMinus = 1;
      }

      var originx = ((scalex * x1) / scalexMinus) * 100;
      var originy = ((scaley * y1) / scaleyMinus) * 100;

      scalex = roundToNearest(scalex, 0);
      scaley = roundToNearest(scaley, 0);
      originx = roundToNearest(originx, 0);
      originy = roundToNearest(originy, 0);

      let spltUrl = device["url"].split("?");
      url =
        spltUrl[0] +
        "?" +
        spltUrl[1] +
        `&scalex=${scalex}&scaley=${scaley}&originx=${originx}&originy=${originy}&rotate=0` +
        "&cast=true";

      console.log("url : ", url);
    }


      if (data.device && data.device.casterId) {
        var timeStamp = new Date().getTime();
        sendCasterStatus({
          casterId: data.device.casterId,
          timestamp: timeStamp,
          state: "running",
        });
      }

      var deviceObject = new nodecastor.CastDevice({
        friendlyName: deviceName,
        name: deviceName,
        address: host,
      });

      await new Promise((resolve, reject) => {
        deviceObject.on("connect", () => {
          deviceObject.status((err, status) => {
            if (err) {
              console.log(err);
              reject(err);
              return;
            }

            console.log("Device status done");
            if (data.device && data.device.casterId) {
              var timeStamp = new Date().getTime();
              sendDeviceStatus({
                casterId: data.device.casterId,
                chromecastId: device.host,
                timestamp: timeStamp,
                state: "success",
              });
            }

            try {
              deviceObject.application("5CB45E5A", (err, application) => {
                if (err) {
                  console.log(err);
                  reject(err);
                  return;
                }
                application.run("urn:x-cast:com.url.cast", (err, session) => {
                  if (err) {
                    console.log(err);
                    reject(err);
                    return;
                  }
                  session.send({ type: "loc", url: url }, (err, data) => {
                    if (err) {
                      console.log(err);
                      reject(err);
                      return;
                    }
                    console.log("Casting success to device:", deviceName);
                    resolve();
                  });
                });
              });
            } catch (error) {
              console.log(error);
              reject(error);
              return;
            }
          });
        });
      });
    }
  } catch (error) {
    console.log("Error in casting:", error);
  }
}


//function to stop casting
function stopCastDevice(data) {
  console.log("inside stop cast")
  try {

  let castdevices = JSON.parse(data);
  console.log("===data====", castdevices);

  castdevices.forEach(function (device) {
    let host = device.device_ip;
    console.log("=host==", host);

    const client = new Client();

    client.connect(host, () => {
      client.launch(DefaultMediaReceiver, (err, player) => {
        // player.stop();
        client.close();
      });
    });

    client.on("error", (err) => {
      console.log("Error occurred for stop the casting:", err);
    });
  });
    
  } catch (error) {
    console.log("stopped : ", error)
  }
}