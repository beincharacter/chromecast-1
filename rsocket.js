const { RSocketClient, JsonSerializer, IdentitySerializer } = require("rsocket-core");
const RSocketTcpClient = require("rsocket-tcp-client").default;
const nodecastor = require("nodecastor");
const { Client } = require("castv2-client");
const { DefaultMediaReceiver } = require("castv2-client");
const ping = require("ping");

const CAST_APP_ID = "5CB45E5A";

let client = undefined;

const setupRSocketClient = () => {
    client = new RSocketClient({
        serializers: {
            data: JsonSerializer,
            metadata: IdentitySerializer,
        },
        setup: {
            keepAlive: 6000000,
            lifetime: 18000000,
            dataMimeType: "application/json",
            metadataMimeType: "message/x.rsocket.routing.v0",
        },
        transport: new RSocketTcpClient({
            host: "192.168.28.11",
            port: 7000,
        }),
    });
};

const startCasting = async (device) => {
    try {
        const { device_name, device_ip, url, x1, x2, y1, y2 } = device;
        console.log("Casting to device:", device_name);
        
        let res = await ping.promise.probe(device_ip);
        console.log("alive : ", res.alive);
        if (!res.alive) return "Device not found on network"; // let scaleFactorParams = "";
        if (x1 && x2 && y1 && y2) {
            const scaleParams = calculateScaleParams(x1, x2, y1, y2);
            scaleFactorParams = `&scalex=${scaleParams.scalex}&scaley=${scaleParams.scaley}&originx=${scaleParams.originx}&originy=${scaleParams.originy}&rotate=0`;
        }

        let finalUrl = url;
        finalUrl += `?${scaleFactorParams}&cast=true`;

        console.log("final url ,", finalUrl)
        const deviceObject = new nodecastor.CastDevice({
            friendlyName: device_name,
            name: device_name,
            address: device_ip,
        });

        await new Promise((resolve, reject) => {
            deviceObject.on("connect", () => {
                deviceObject.status((err, status) => {
                    if (err) {
                        console.error("Device status error:", err);
                        reject(err);
                        return;
                    }
                    console.log("Device status done");
                    if (device.device && device.device.casterId) {
                        sendDeviceStatus({ casterId: device.device.casterId, chromecastId: device.host, timestamp: Date.now(), state: "success" });
                    }

                    try {
                        deviceObject.application(CAST_APP_ID, (err, application) => {
                            if (err) {
                                console.error("Application error:", err);
                                reject(err);
                                return;
                            }
                            application.run("urn:x-cast:com.url.cast", (err, session) => {
                                if (err) {
                                    console.error("Run error:", err);
                                    reject(err);
                                    return;
                                }
                                session.send({ type: "loc", url: finalUrl }, (err, data) => {
                                    if (err) {
                                        console.error("Send error:", err);
                                        reject(err);
                                        return;
                                    }
                                    console.log("Casting success to device:", device_name);
                                    resolve();
                                });
                            });
                        });
                    } catch (error) {
                        console.error("Casting error:", error);
                        reject(error);
                    }
                });
            });
        });

        return "casting done";
    } catch (error) {
        console.error("Error in casting:", error);
    }

};

const stopCasting = async (device) => {
    console.log("Stopping casting");
    try {
        const { device_ip } = device;    

        let res = await ping.promise.probe(device_ip);
        console.log("alive : ", res.alive);
        if(!res.alive) return "Device not found on network";

        const client = new Client();
        await new Promise((resolve, reject) => {
            client.connect(device_ip, () => {
                client.launch(DefaultMediaReceiver, (err) => {
                    if (err) {
                        console.error("Launch error:", err);
                        reject(err);
                        return;
                    }
                    console.log("Stopped casting to device:", device.device_name);
                    client.close();
                    resolve();
                });
            });
            client.on("error", (err) => {
                console.error("Error occurred for stopping the casting:", err);
                reject(err);
            });
        });
    } catch (error) {
        console.error("Stop casting error:", error);
    }
};

const roundToNearest = (number, decimalPlaces) => {
    const factor = Math.pow(10, decimalPlaces);
    return (Math.round(number * factor) / factor).toFixed(decimalPlaces);
  }

const calculateScaleParams = (x1, x2, y1, y2) => {
    
    var x2 = parseFloat(x2) / 100;
    var x1 = parseFloat(x1) / 100;
    var y1 = parseFloat(y1) / 100;
    var y2 = parseFloat(y2) / 100;
    
    var minusX = x2 - x1;
    var scalex = 1 / minusX;
    var scalexMinus = scalex - 1;
    if (scalexMinus === 0) {
      scalexMinus = 1;
    }

    var minusY = y2 - y1;
    var scaley = 1 / minusY;
    var scaleyMinus = scaley - 1;
    if (scaleyMinus === 0) {
      scaleyMinus = 1;
    }

    var originx = ((scalex * x1) / scalexMinus) * 100;
    var originy = ((scaley * y1) / scaleyMinus) * 100;
    scalex = roundToNearest(scalex, 2);
    scaley = roundToNearest(scaley, 2);
    originx = roundToNearest(originx, 2);
    originy = roundToNearest(originy, 2);

    console.log(
      "scalex : ",
      scalex,
      " scaley : ",
      scaley,
      " originx ; ",
      originx,
      " originy : ",
      originy
    );
    return { scalex, scaley, originx, originy };
};

// Main
setupRSocketClient();

client.connect().subscribe({
    onComplete: (socket) => {
        console.log("Connected");
        socket.fireAndForget({});
        socket.requestStream({
            data: { streamId: "COMMAND", type: "COMMAND", component: "COMMAND" },   
            metadata: "STREAM_REQUEST",
        }).subscribe({
            onComplete: () => console.log("Complete"),
            onError: (error) => {
                console.error("Error occurred:", error);
            },
            onNext: async (payload) => {
                const dataObj = JSON.parse(payload.data);
                console.log("Triggered data:", dataObj.length);
                console.log("Cast status:", dataObj.castStatus);
                if (dataObj[0]?.castStatus === "StopCast") {
                    
                    for (let i = 0; i < dataObj.length; i++) {
                        await stopCasting(dataObj[i]);
                    }

                } else {
                    console.log("Starting cast");
                    for (let i = 0; i < dataObj.length; i++) {
                        await stopCasting(dataObj[i]);
                        await startCasting(dataObj[i]);
                    }
                }
            },
            onSubscribe: (subscription) => {
                subscription.request(2147483647);
            },
        });
    },
    onError: (error) => {
        console.error("Connection error:", error);
    },
    onSubscribe: (cancel) => {
        /* call cancel() to abort */
    },
});
