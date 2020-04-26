#!/usr/bin/env node
"use strict";

const mqttusvc = require("mqtt-usvc");

const EweLink = require("ewelink-api");

let devices = {};

const service = mqttusvc.create();
console.log(service.config);
const connection = new EweLink({
  email: service.config.email,
  password: service.config.password
});

service.on("message", async (topic, data) => {
  if (!topic.startsWith("~/set/")) {
    console.log("unsupported message", topic);
    return;
  }

  try {
    const [, , deviceId, action] = topic.split("/");
    console.info(`SET DEVICE [${deviceId}] '${action}' ${data}`);

    const status = await handleAction(deviceId, action, data);
    console.log("RESPONSE", status);
  } catch (err) {
    console.error("ERR", err);
  }
});

service.subscribe("~/set/#");

connect();

async function handleAction(deviceId, action, data) {
  switch (action) {
    case "power":
      return connection.setDevicePowerState(deviceId, JSON.parse(data));
    case "on":
    case "off":
    case "toggle":
      return connection.setDevicePowerState(deviceId, action);
  }
}

async function connect() {
  try {
    await connection.login();

    const apiDevices = await connection.getDevices();

    console.log(`Found ${apiDevices.length} devices`);

    apiDevices.forEach(d => {
      console.log(
        `${d.name} [${d.deviceid}] (${d.brandName} ${d.productModel}|${d.params.fwVersion}) online=${d.online} switch=${d.params.switch}`
      );
      devices[d.deviceid] = d;
    });

    // call openWebSocket method with a callback as argument
    const socket = await connection.openWebSocket(async data => {
      try {
        // data is the message from eWeLink
        // console.log(data);
        const { deviceid, action, params } = data;
        const device = devices[deviceid];

        // TODO: fetch new devices
        if (!device) {
          return;
        }

        Object.assign(device, params);

        service.send(`status/${deviceid}`, device);

        if (params.switch) {
          service.send(`status/${deviceid}/switch`, params.switch);
          service.send(`status/${deviceid}/switch/${params.switch}`);
        }
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
