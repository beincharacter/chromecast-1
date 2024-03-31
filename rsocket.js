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
        if (!res.alive) return "Device not found on network"; 

        let finalUrl = url;
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
                client.launch(DefaultMediaReceiver, (err) => { // Default Media Receiver ID
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

const onNextHandler = () => {
    // Implement onNextHandler
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
                    console.log("Stopping cast");
                    await stopCasting(JSON.parse(payload.data));
                    console.log("Start casting after stop");
                    for (let i = 0; i < dataObj.length; i++) {
                        console.log("Starting cast");
                        await startCasting(dataObj[i]);
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
