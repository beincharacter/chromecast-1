const { RSocketClient, JsonSerializer, IdentitySerializer } = require("rsocket-core");
const RSocketTcpClient = require("rsocket-tcp-client").default;
const { startCasting, stopCasting } = require("./castingFunctions");

let client = undefined;

const setupRSocketClient = (callback) => {
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
                    console.log("Triggered data:", dataObj);

                    for (let i = 0; i < dataObj.length; i++) {
                        if(dataObj[i].isStop) await stopCasting(dataObj[i])
                        else {
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
};

module.exports = { setupRSocketClient };
