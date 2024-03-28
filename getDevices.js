require("./rsocket");

const mdns_js = require("mdns-js");
const wifi = require("node-wifi");
const axios = require("axios");

const device_schema_id = "65f95d08808f4c17488b6588";
const network_schema_id = "63f5c412e6edae00011ed2d0";
let previousWifiDetails = {};
let wifi_details = {};
const foundedDevices = [];

// Discover Wi-Fi networks
async function wifiDiscovery() {
  return new Promise((resolve, reject) => {
    wifi.init();

    wifi.getCurrentConnections(async (error, currentConnections) => {
      if (error) {
        reject(error);
      } else if (currentConnections && currentConnections.length > 0) {
        const connectedNetwork = currentConnections[0];
        const newWifiDetails = {
          wifi_name: connectedNetwork.ssid,
          wifi_id: connectedNetwork.mac,
        };

        if (
          newWifiDetails.wifi_name !== previousWifiDetails.wifi_name ||
          newWifiDetails.wifi_id !== previousWifiDetails.wifi_id
        ) {
          // Delete devices of the connected network
          console.log("New network found : ", newWifiDetails);
          try {
            const res = await deleteDevicesOfThisNetwork(
              newWifiDetails.wifi_id
            );
          } catch (err) {
            // console.log("Response : ", err.response);
          }

          // Network related calls
          try {
            await network_check(
              newWifiDetails.wifi_name,
              newWifiDetails.wifi_id
            )
              .then(async (res) => {
                if (res.data.entities && res.data.entities.length > 0) {
                  console.log("Network Already Existed");
                  return;
                }

                await network_post(
                  newWifiDetails.wifi_name,
                  newWifiDetails.wifi_id
                )
                  .then((res) => {
                    // console.log("Response In Network Posting : ", res.data);
                  })
                  .catch((error) => {
                    console.log("Error In Network Posting : ", error);
                  });
              })
              .catch((error) => {
                console.log("Error In Network Checking : ", "error");
              });
          } catch (error) {
            console.log("Error : ", error);
          }

          wifi_details = newWifiDetails;
          previousWifiDetails = newWifiDetails;
          resolve();
        } else {
          wifi_details = newWifiDetails;
          previousWifiDetails = newWifiDetails;
          resolve();
        }
      } else {
        console.log("Not connected to any Wi-Fi network");
        resolve();
      }
    });
  });
}

// Discover Chromecast devices
async function deviceDiscovery() {
  console.log("Inside Device Discovery Function");
  return new Promise((resolve, reject) => {
    const browser = mdns_js.createBrowser(mdns_js.tcp("googlecast"));

    browser.on("ready", () => {
      browser.discover();
    });

    browser.on("update", async (data) => {
      if (data.txt) {
        const txtAttributes = txtIttr(data.txt);
        const deviceName = txtAttributes.fn;
        const ipAddress = data.addresses[0];

        const timestamp = new Date().getTime();

        const isChromecastDevice = data?.fullname?.includes("googlecast");

        if (isChromecastDevice) {
          const existingDevice = foundedDevices.find(
            (device) => device.chromecastDeviceId === ipAddress
          );

          if (!existingDevice) {
            foundedDevices.push({
              casterId: wifi_details.wifi_id,
              chromecastDeviceId: ipAddress,
              chromecastDeviceName: deviceName,
              timestamp: timestamp,
            });

            console.log("New Device found : ", deviceName);

            // Post device details
            try {
              await device_post({
                "caster_id": wifi_details.wifi_id,
                "device_ip": ipAddress,
                "device_name": deviceName
              })
              .then((response) => {
                console.log("Device Post Response : ", response.data);
              })
              .catch((error) => {
                console.log("Device Post Error : ", error.message);
              });
            } catch (error) {
              console.log("Error in device posting : ", error);
            }
          }
        }
      }
    });

    setTimeout(() => {
      browser.stop();
      resolve();
    }, 5000);
  });
}

function txtIttr(txtArray) {
  // console.log("txtArray : ",txtArray);
  return txtArray.reduce((attributes, txt) => {
    const [key, value] = txt.split("=");
    attributes[key] = value;
    return attributes;
  }, {});
}

// Check network details
function network_check(name, ip) {
  console.log("Inside Check Network Post Details");
  const network_check_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${network_schema_id}/instances/list`;

  return axios.post(network_check_api, {
    casterId: ip,
  });
}

// Posting network details
function network_post(name, ip) {
  console.log("Inside Network Post Details");
  const network_post_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${network_schema_id}/instance?upsert=false`;

  return axios.post(network_post_api, {
    casterId: ip,
    networkName: name,
    state: "active",
  });
}

// Posting device details
function device_post(obj) {
  console.log("Device Data : ", obj);
  const device_post_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${device_schema_id}/instance`;
  return axios.post(device_post_api, obj);
}

// Delete all devices of a given network
function deleteDevicesOfThisNetwork(macId) {
  const device_delete_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${device_schema_id}/instances`;
  return axios.delete(device_delete_api, {
    data: {
      casterId: macId,
    },
  });
}

// Recursive function for continuous discovery
async function continuousDiscovery() {
  try {
    await wifiDiscovery()
      .then()
      .catch((error) => {
        console.log("Error in wifi connection : ", error);
      });
    await deviceDiscovery()
      .then()
      .catch((error) => {
        console.log("Error in device finding : ", error);
      });

    setTimeout(continuousDiscovery, 5000);
  } catch (error) {
    console.log("Error");
  }
}

// Start the device discovery
continuousDiscovery();
