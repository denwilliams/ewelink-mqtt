#!/usr/bin/env node
"use strict";

const mqttusvc = require("mqtt-usvc");
const { EweClient } = require("./ewelink");

async function main() {
  const service = await mqttusvc.create();

  const client = new EweClient({
    account: service.config.account,
    password: service.config.password,
    areaCode: service.config.areaCode || "+1",
    region: service.config.region || "us",
  });

  client.onMessage((msg) => {
    const { deviceid, action, params } = msg;

    if (!deviceid || !params) {
      if (msg.config) {
        // heartbeat
        return;
      }
      console.warn("Unsupported eWeLink message %j", msg);
      return;
    }

    service.send(`~/status/${deviceid}`, { action, params });
    if (params.switch) {
      service.send(`~/status/${deviceid}/switch`, params.switch);
      service.send(`~/status/${deviceid}/switch/${params.switch}`);
    } else {
      console.warn(
        "Unexpected message params device=%s params=%j",
        deviceid,
        params
      );
    }
  });

  service.on("message", async (topic, data) => {
    if (!topic.startsWith("~/set/")) {
      console.log("Unsupported MQTT message", topic);
      return;
    }

    try {
      const [, , deviceId, action] = topic.split("/");
      console.info(`Setting device [${deviceId}] '${action}' ${data}`);

      const status = await handleAction(deviceId, action, data);
      console.log("Response %j", status);
    } catch (err) {
      console.error("Error", err);
    }
  });

  await client.init();
  service.subscribe("~/set/#");

  async function handleAction(deviceId, action, data) {
    switch (action) {
      case "on":
      case "off":
      case "toggle":
        return client.lanSwitch(deviceId, { switch: action });
      case "power":
        return client.lanSwitch(deviceId, data);
      default:
        console.warn(`Unsupported action ${action}`);
    }
  }
}

main().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
