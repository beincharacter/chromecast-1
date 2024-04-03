require("./rsocket");

const mdns_js = require("mdns-js");
const wifi = require("node-wifi");
const axios = require("axios");

const device_schema_id = "65fd1d937bd0d166a1817056";
const network_schema_id = "65fd18117bd0d166a1817052";
const token = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZmOGYxNjhmLTNmZjYtNDZlMi1iMTJlLWE2YTdlN2Y2YTY5MCJ9.eyJwcm9maWxlVXJsIjoid3d3Lmdvb2dsZS5jb20vaW1hZ2VzL2F2aW5hc2gtcGF0ZWwtcm9ja3oiLCJyZWNlbnRfc2Vzc2lvbiI6Ik5BIiwic3ViIjoiZ2FpYW4uY29tIiwicGFyZW50VGVuYW50SWQiOiJOQSIsImNvbG9yIjpudWxsLCJ1c2VyX25hbWUiOiJtb2JpbGUxMEBnYXRlc3RhdXRvbWF0aW9uLmNvbSIsImlzcyI6ImdhaWFuLmNvbSIsImlzQWRtaW4iOnRydWUsInBsYXRmb3JtSWQiOiI2NWNmMGU1MWMzNGZmYjA3ZDg1NTQ4YWUiLCJ1c2VyTmFtZSI6Im1vYmlsZTEwQGdhdGVzdGF1dG9tYXRpb24uY29tIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9NQVJLRVRQTEFDRV9VU0VSIl0sImNsaWVudF9pZCI6ImdhaWFuIiwic2NvcGUiOlsidHJ1c3QiLCJyZWFkIiwid3JpdGUiXSwidGVuYW50SWQiOiI2NWNmMGJkNzlkNTU0MjAwMDFhYTdjMjIiLCJsb2dvIjoid3d3Lmdvb2dsZS5jb20vaW1hZ2VzLiIsImV4cCI6MTcwODExMjEyMiwianRpIjoiYzM1NDdlYjUtMGY3Yi00YWMyLTg4ZDgtMTI1YzY0ZDcxOTgzIiwiZW1haWwiOiJtaWFzdGVzdGVudkBnYXRlc3RhdXRvbWF0aW9uLmNvbSJ9.i-I_6i_I6r8_fWAf0d-uZEZxxcFfcOjheYApaN9PRZx7OhFd0mw-GTlbjRgVyQK2Nm5cVfNt6KdXM7elm3rS1MPJOPZqr5n6fmh7Jg1vo8i4b0gyNT5N3XxVNMUQATK2sZsPZFOS1p6hZzE2kZ4mtvuXgxGtHpbSNhzgf7iShBFFGD-pUBQ3DRYM5BkbkORpgzyizgA0Qd0LOiLMJKrasjnGtNUfDcHHTd6YTfkSIA649YNDh5sWKl2CbD5UkIJie7m8roLl3Ipuu4At8Y5qlgh14XaU5jXrCV-Uy7Ze8TQyWEqYD07RQZb0E3KrndjQojG8WS3IM5yBOLAI3fsWMQeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZmOGYxNjhmLTNmZjYtNDZlMi1iMTJlLWE2YTdlN2Y2YTY5MCJ9.eyJwcm9maWxlVXJsIjoid3d3Lmdvb2dsZS5jb20vaW1hZ2VzL2F2aW5hc2gtcGF0ZWwtcm9ja3oiLCJyZWNlbnRfc2Vzc2lvbiI6Ik5BIiwic3ViIjoiZ2FpYW4uY29tIiwicGFyZW50VGVuYW50SWQiOiJOQSIsImNvbG9yIjpudWxsLCJ1c2VyX25hbWUiOiJtb2JpbGUxMEBnYXRlc3RhdXRvbWF0aW9uLmNvbSIsImlzcyI6ImdhaWFuLmNvbSIsImlzQWRtaW4iOnRydWUsInBsYXRmb3JtSWQiOiI2NWNmMGU1MWMzNGZmYjA3ZDg1NTQ4YWUiLCJ1c2VyTmFtZSI6Im1vYmlsZTEwQGdhdGVzdGF1dG9tYXRpb24uY29tIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9NQVJLRVRQTEFDRV9VU0VSIl0sImNsaWVudF9pZCI6ImdhaWFuIiwic2NvcGUiOlsidHJ1c3QiLCJyZWFkIiwid3JpdGUiXSwidGVuYW50SWQiOiI2NWNmMGJkNzlkNTU0MjAwMDFhYTdjMjIiLCJsb2dvIjoid3d3Lmdvb2dsZS5jb20vaW1hZ2VzLiIsImV4cCI6MTcwODExMjEyMiwianRpIjoiYzM1NDdlYjUtMGY3Yi00YWMyLTg4ZDgtMTI1YzY0ZDcxOTgzIiwiZW1haWwiOiJtaWFzdGVzdGVudkBnYXRlc3RhdXRvbWF0aW9uLmNvbSJ9.i-I_6i_I6r8_fWAf0d-uZEZxxcFfcOjheYApaN9PRZx7OhFd0mw-GTlbjRgVyQK2Nm5cVfNt6KdXM7elm3rS1MPJOPZqr5n6fmh7Jg1vo8i4b0gyNT5N3XxVNMUQATK2sZsPZFOS1p6hZzE2kZ4mtvuXgxGtHpbSNhzgf7iShBFFGD-pUBQ3DRYM5BkbkORpgzyizgA0Qd0LOiLMJKrasjnGtNUfDcHHTd6YTfkSIA649YNDh5sWKl2CbD5UkIJie7m8roLl3Ipuu4At8Y5qlgh14XaU5jXrCV-Uy7Ze8TQyWEqYD07RQZb0E3KrndjQojG8WS3IM5yBOLAI3fsWMQ";
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
              ).then((res) => {
                console.log("Response In Network Posting : ", res.data.status); 
              }).catch((error) => {
                console.log("Error In Network Posting : ", error);
              });
            }).catch((error) => {
              console.log("Error In Network Checking : ", error.message);
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
              await device_post(wifi_details.wifi_id, ipAddress, deviceName)
              .then((response) => {
                console.log("Device Post Response : ", response.data.status);
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
async function network_check(name, ip) {
  console.log("Inside Check Network Post Details");
  const network_check_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${network_schema_id}/instances/list`;

  return axios.post(network_check_api, {
    caster_id: ip
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });
}

// Posting network details
function network_post(name, ip) {
  console.log("Inside Network Post Details");
  const network_post_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${network_schema_id}/instance?upsert=false`;

  return axios.post(network_post_api, {
    caster_id: ip,
    network_name: name,
    state: "active"
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });
}

// Posting device details
function device_post(wifi_id, ipAddress, deviceName) {
  console.log("Device Data : ", wifi_details.wifi_id, ipAddress, deviceName);
  const device_post_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${device_schema_id}/instance`;
  
  return axios.post(device_post_api, {
    "caster_id": wifi_id,
    "chromecastDeviceName": deviceName,
    "chromecastDeviceId": ipAddress
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });
}

// Delete all devices of a given network
function deleteDevicesOfThisNetwork(macId) {
  const device_delete_api = `https://ig.aidtaas.com/tf-entity-ingestion/v1.0/schemas/${device_schema_id}/instances`;
  return axios.delete(device_delete_api, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    data: {
      caster_id: macId,
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
