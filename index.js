var debug = require('debug')('chromecasts')
var events = require('events')
var get = require('simple-get')
var mdns = require('multicast-dns')
var parseString = require('xml2js').parseString 
const nodecastor = require(  "nodecastor" );
var SSDP
try {
  SSDP = require('node-ssdp').Client
} catch (err) {
  SSDP = null
}

var thunky = require('thunky')
var url = require('url')

var devices = []


module.exports.fn1 = function() {
  var dns = mdns()
  console.log('====dns===>>',dns)
  var that = new events.EventEmitter()
  var casts = {}
  var ssdp = SSDP ? new SSDP({logLevel: process.env.DEBUG ? 'trace' : false}) : null

  var emit = function (cst) {
    if (!cst || !cst.host || cst.emitted) return
    cst.emitted = true
    devices.push({name:cst.name,host:cst.host})
   
  // console.log('=====================######################======================')
  //  var device = new nodecastor.CastDevice({
	// 	friendlyName: cst.name,
  //   name: cst.name,
	// 	address: cst.host
	// });
	// device.on( "connect" , () => {
	// 	device.status( ( err , status ) => {
	// 		if ( err ) { console.log( err ); return; }
	// 		console.log( status );
	// 		 let url_test = "https://www.gaiansolutions.com/"
  //     return new Promise( function( resolve , reject ) {
  //       try {
  //         device.application( "5CB45E5A" , ( err , application ) => {
  //           if ( err ) { console.log( err ); return; }
  //           application.run( "urn:x-cast:com.url.cast" , ( err , session ) => {
  //             if ( err ) { console.log( error ); return; }
  //             console.log( session );
  //             session.send( { "type": "loc" , "url": url_test } , ( err , data ) => {
  //               console.log( data );
  //               resolve();
  //               return;
  //             });
  //           });
  //         });
  //       }
  //       catch( error ) { console.log( error ); reject( error ); return; }
  //     });
	// 	});
	// })

  }

  dns.on('response', function (response) {
    response.answers.forEach(function (a) {
      if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
        var name = a.data
        var shortname = a.data.replace('._googlecast._tcp.local', '')
        if (!casts[name]) casts[name] = {name: shortname, host: null}
      }
    })

    var onanswer = function (a) {
      debug('got answer %j', a)

      var name = a.name;
      console.log('-casts--->>>',casts)
      if (a.type === 'SRV' && casts[name] && !casts[name].host) {
        casts[name].host = a.data.target
        emit(casts[name])
      }

      // setTimeout(()=>{
      //   console.log('222222222222')
      //   console.log('######',casts)
      //   return casts
      // },1000)

    }

    response.additionals.forEach(onanswer)
    response.answers.forEach(onanswer)
  })

  if (ssdp) {
    ssdp.on('response', function (headers, statusCode, info) {
      if (!headers.LOCATION) return

      get.concat(headers.LOCATION, function (err, res, body) {
        if (err) return
        parseString(body.toString(), {explicitArray: false, explicitRoot: false},
          function (err, service) {
            if (err) return
            if (!service.device) return
            if (service.device.manufacturer !== 'Google Inc.') return

            debug('device %j', service.device)

            var name = service.device.friendlyName

            if (!name) return

            var host = url.parse(service.URLBase).hostname

            if (!casts[name]) {
              casts[name] = {name: name, host: host}
              return emit(casts[name])
            }

            if (casts[name] && !casts[name].host) {
              casts[name].host = host
              emit(casts[name])
            }

          })
      })
    })

  }

  that.update = function () {
    debug('querying mdns and ssdp')
    if (ssdp) ssdp.search('urn:dial-multiscreen-org:device:dial:1')
    dns.query('_googlecast._tcp.local', 'PTR')
  }
 

  that.destroy = function () {
    dns.destroy()
  }

  that.update();

   that.showDevices = function () {
    // return {name:'aaaaa'}
    // setTimeout(()=>{
      // console.log('1111111111111111111')
      console.log('@@@@@@@@@@',casts)
  
      return casts
    // },500)
  }


  this.CastDevice = function(data){
    // let data = [
    //   {
    //     "name": "GAIAN SOLUTIONS TV 7",
    //   "host": "192.168.0.100",
    //   "url": "https://www.google.com/"
    //   }
    // ]

    data.forEach(function(device) {
      
      let deviceName = device.name;
      let host = device.host;
      let url = device.url;

   var device = new nodecastor.CastDevice({
		friendlyName: deviceName,
    name: deviceName,
		address: host
	});
	device.on( "connect" , () => {
		device.status( ( err , status ) => {
			if ( err ) { console.log( err ); return; }
			console.log( status );
      return new Promise( function( resolve , reject ) {
        try {
          device.application( "5CB45E5A" , ( err , application ) => {
            if ( err ) { console.log( err ); return; }
            application.run( "urn:x-cast:com.url.cast" , ( err , session ) => {
              if ( err ) { console.log( error ); return; }
              console.log( session );
              session.send( { "type": "loc" , "url": url } , ( err , data ) => {
                console.log( data );
                resolve();
                return;
              });
            });
          });
        }
        catch( error ) { console.log( error ); reject( error ); return; }
      });
		});
	})






    })
   
  }

 
  
  return that
}
