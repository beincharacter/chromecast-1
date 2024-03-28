const {
  RSocketClient,
  JsonSerializer,
  IdentitySerializer
} = require('rsocket-core');
const RSocketWebSocketClient = require('rsocket-websocket-client').default;
const RSocketTcpClient = require('rsocket-tcp-client').default;
const nodecastor = require("nodecastor");

var client = undefined;


  // Create an instance of a client
  // client = new RSocketClient({
  //   serializers: {
  //     data: JsonSerializer,
  //     metadata: IdentitySerializer
  //   },
  //   setup: {
  //     // ms btw sending keepalive to server
  //     keepAlive: 60000,
  //     // ms timeout if no keepalive response
  //     lifetime: 180000,
  //     // format of `data`
  //     dataMimeType: 'application/json',
  //     // format of `metadata`
  //     metadataMimeType: 'message/x.rsocket.routing.v0',
  //   },
  //   transport: new RSocketTcpClient({
  //     host: '24.199.74.9',
  //     port: 7000,
  //   }),
  // });

  // Open the connection
  // client.connect().subscribe({
  //   onComplete: socket => {
  //     // socket provides the rsocket interactions fire/forget, request/response,
  //     // request/stream, etc as well as methods to close the socket.
  //     console.log("=========")
  //     // console.log(socket)
  //     socket.fireAndForget({})
  //     socket.requestStream({
  //       data: {"streamId":"COMMAND","type":"DATA","component":"IS"},
  //       metadata: "STREAM_REQUEST",
  //     }).subscribe({
  //       onComplete: () => console.log('complete'),
  //       onError: error => {
  //         console.log(error);
  //         // addErrorMessage("Connection has been closed due to ", error);
  //       },
  //       onNext: payload => {
  //         console.log(payload.data);
  //         stopCast(payload.data)
  //         //cast device code

  //         //end cast device code 
  //         // addMessage(payload.data);
  //       },
  //       onSubscribe: subscription => {
  //         subscription.request(2147483647);
  //       },
  //     });
  //   },
  //   onError: error => {
  //     console.log(error);
  //     // addErrorMessage("Connection has been refused due to ", error);
  //   },
  //   onSubscribe: cancel => {
  //     /* call cancel() to abort */
  //   }
  // });


module.exports.fn1 = function() {

  function stopCast(){
    console.log("###############################")
    data = [
      {
        "name": "GAIAN OFFICE TV",
      "host": "192.168.0.100"
      }
    ]

    data.forEach(function(device) {
      let deviceName = device.name;
      let host = device.host;
    

   var device = new nodecastor.CastDevice({
		friendlyName: deviceName,
    name: deviceName,
		address: host
	});
 
  device.on( "connect" , () => {

    device.status( ( err , status ) => {
			if ( err ) { console.log( err ); return; }
			console.log("====status=====", status );
      console.log("=======status done=======");
      device.application( "5CB45E5A" , ( err , application ) => {
        if ( err ) { console.log( err ); return; }
        application.run( "urn:x-cast:com.url.cast" , ( err , session ) => {
          if ( err ) { console.log( error ); return; }
          console.log( session );
          session.send( { "type": "loc" , "url": "https://google.com/" } , ( err , data ) => {
            console.log( data );
 
           
            return;
          });
        });
      });
      // device.stop()

    })


  })
  
})

}
stopCast()

}
