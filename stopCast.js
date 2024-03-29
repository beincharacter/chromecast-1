var ping = require('ping');

var hosts = ['192.168.0.185'];

const haha = async () => {
  for(let host of hosts){
    let res = await ping.promise.probe(host);
    console.log("alive : ", res.alive);
    if(!res.alive) return "Devie not found on network"; 
    console.log("alive after : ", res.alive);
  }
}

haha()