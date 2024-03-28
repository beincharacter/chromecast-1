require('./rsocket');
const axios = require('axios');

var networkName = "";
var networkCaster = "HAMSA villa";
var schemaId = "63f6041fe25bfe000144a849";
var schemaId1 = "63f5c412e6edae00011ed2d0";

deletetDevice({ "casterId": networkCaster },schemaId);
// deletetDevice({ "casterId": networkCaster },schemaId1);
 
sendNetworkDeviceInfo();
var debug = require('debug')('chromecasts')
var events = require('events')
var get = require('simple-get')
var mdns = require('multicast-dns')
var parseString = require('xml2js').parseString
// const nodecastor = require("nodecastor");



var SSDP
try {
  SSDP = require('node-ssdp').Client
} catch (err) {
  SSDP = null
}

var thunky = require('thunky')
var url = require('url')
var http = require('http');
var deviceList = [];

var devices = [];


module.exports.cast = function () {

  var dns = mdns()
  var that = new events.EventEmitter()
  var casts = {}
  var ssdp = SSDP ? new SSDP({ logLevel: process.env.DEBUG ? 'trace' : false }) : null

  ssdp = SSDP ? new SSDP({ logLevel: process.env.DEBUG ? 'trace' : false }) : null;


  var emit = function (cst) {
    if (!cst || !cst.host || cst.emitted) return
    cst.emitted = true;

console.log("==casts===>>>",casts)
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
  let i = 0;
  dns.on('response', function (response) {
    // console.log('---response.answers---',response.answers)
    response.answers.forEach(function (a) {
      if (a.type === 'PTR' && a.name === '_googlecast._tcp.local') {
        var name = a.data
        var shortname = a.data.replace('._googlecast._tcp.local', '')
        if (!casts[name]) casts[name] = { name: shortname, host: null }
      }
    })

    var onanswer = function (a) {
      debug('got answer %j', a)
      let ip = ""
      if (a && a.data && a.data.target) {
        ip = a.data.target;
      }
      var name = a.name;
      let hostname = ip;
      if (a.type === 'SRV' && casts[name] && !casts[name].host) {
        // if(!hostname.includes('local')){
        console.log("-hostname---", hostname)
        // }

        casts[name].host = ip;

        emit(casts[name])
      }

      // setTimeout(()=>{
      //   console.log('222222222222')
      //   console.log('######',casts)
      //   return casts
      // },1000)


    }

    // console.log('#############????',response.additionals.length);

    response.additionals.forEach(onanswer)
    response.answers.forEach(onanswer);

    // console.log("=========casts===============",casts)
    if (i == 0) {
      getdeviceslist(casts);
    }
    i++;
  })

  if (ssdp) {
    ssdp.on('response', function (headers, statusCode, info) {
      if (!headers.LOCATION) return

      get.concat(headers.LOCATION, function (err, res, body) {
        if (err) return
        parseString(body.toString(), { explicitArray: false, explicitRoot: false },
          function (err, service) {
            if (err) return
            if (!service.device) return
            if (service.device.manufacturer !== 'Google Inc.') return

            debug('device %j', service.device)

            var name = service.device.friendlyName

            if (!name) return

            var host = url.parse(service.URLBase).hostname

            if (!casts[name]) {
              casts[name] = { name: name, host: host }
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
    console.log('querying mdns and ssdp')
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
    console.log('@@@@@@@@@@', casts)

    return casts
    // },500)
  }



  return that
}

let castmodule = module.exports;
castmodule.cast();
var timer = setInterval(() => {
  console.log("====########searching devices...#########===")
  castmodule.cast();
}, 20000);

function deletetDevice(data,schema_Id="") {

  //delete disconnted device from devices
  if (devices && devices.length > 0) {
    console.log("===deleted data===", data);
    let index = devices.indexOf(data.chromecastDeviceId);
    devices.splice(index, 1);
    console.log("====devices list after====", devices);

  }
  let url = `http://ingress-gateway.gaiansolutions.com/tf-web/v1.0/618b6fdef5dacc0001a6b1b0/schemas/${schema_Id}/instances`;
  const body = data;
  //send request
  axios.delete(url,{data:body} )
    .then((response) => {
      //receive response
      // console.log(response);
      // res.status(200).json({ status: 'success' });

    })
    .catch((error) => {
      // console.log(error)
    });

}

function sendNetworkDeviceInfo() {
  const url = 'http://ingress-gateway.gaiansolutions.com/tf-web/v1.0/618b6fdef5dacc0001a6b1b0/schemas/63f5c412e6edae00011ed2d0/instance?upsert=false';
  //create body payload
  const body = { "state": "launched", "casterId": networkCaster, "networkName": networkName }
  //send request 
  axios.post(url, body)
    .then((response) => {
      //receive response
    })
    .catch((error) => {
      // console.log(error)
    });

}

function insertDevice(data) {
  const url = `http://ingress-gateway.gaiansolutions.com/tf-web/v1.0/618b6fdef5dacc0001a6b1b0/schemas/63f6041fe25bfe000144a849/instance?upsert=false`;
  //add headers
  //create body payload
  const body = data;
  //send request 
  axios.post(url, body)
    .then((response) => {
      //receive response
      // console.log(response);
      // res.status(200).json({ status: 'success' });

    })
    .catch((error) => {
      // console.log(error)
    });

}


function sendDeviceStatus(data) {
  const url = 'http://ingress-gateway.gaiansolutions.com/tf-web/v1.0/618b6fdef5dacc0001a6b1b0/schemas/63f894f323a3a70001f61f2b/instance?upsert=false';
  //create body payload
  const body = data;
  //send request 
  axios.post(url, body)
    .then((response) => {
      //receive response
    })
    .catch((error) => {
      // console.log(error)
    });
}


function sendCasterStatus(data) {
  const url = 'http://ingress-gateway.gaiansolutions.com/tf-web/v1.0/618b6fdef5dacc0001a6b1b0/schemas/63f5c3ade6edae00011ed2b9/instance?upsert=false';
  //create body payload
  const body = data;
  //send request 
  axios.post(url, body)
    .then((response) => {
      //receive response
    })
    .catch((error) => {
      // console.log(error)
    });
}

function getdeviceslist(casts) {
  // console.log("====casts===",casts)
  let cast_dvces = []
  setTimeout(() => {
    if (Object.entries(casts).length > 0) {
      for (const [key, value] of Object.entries(casts)) {

        if (devices.indexOf(value.host) != -1) {

        } else {
          if (!value.host.toLowerCase().includes("chromecast")) {
            console.log("==castdevice==", value);
            cast_dvces.push(value.host)
            devices.push(value.host);
            var timeStamp = new Date().getTime();
            insertDevice({ chromecastDeviceName: value.name, chromecastDeviceId: value.host, casterId:networkCaster, timestamp: timeStamp });
            // deviceList.push({chromecastDeviceName:value.name,chromecastDeviceId:value.host,casterId:"Gaian",timestamp: timeStamp})
          }

        }

        //  if(!value.host.includes("local")){
        //   var filteredArray = deviceList.filter(function(itm){
        //     return value.host === itm.chromecastDeviceId;
        //   });
        //   // console.log('--filteredArray--',filteredArray.length)
        //   if(value.host && filteredArray.length <=0){
        //     // deviceList.push({chromecastDeviceName:value.name,chromecastDeviceId:value.host,casterId:"Gaian",timestamp: timeStamp})
        //      deviceList = [deviceList,...[{chromecastDeviceName:value.name,chromecastDeviceId:value.host,casterId:"Gaian",timestamp: timeStamp}]]
        //   }
        //  }
      }
    }

    // console.log("====castdevices====",casts)
    console.log("====founddevices====",devices)
    // if (cast_dvces.length > 0) {
      // let deleted_devices = devices.filter(dev => !cast_dvces.includes(dev))
      // console.log("==deleted_devices_before===", deleted_devices)

      // if (deleted_devices.length > 0) {
      //   console.log("====castdevices====", cast_dvces)
      //   for (var i = 0; i < deleted_devices.length; i++) {
      //     deletetDevice({ "chromecastDeviceId ": deleted_devices[i] },schemaId)
      //   deletetDevice({ "chromecastDeviceId ": deleted_devices[i] },schemaId1)
      //    }
    
      // }
    // }


  }, 5000)

}

function removeDuplicates(arr) {
  return arr.filter((item,
    index) => arr.indexOf(item) === index);
}
