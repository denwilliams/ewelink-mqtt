# ewelink-mqtt

PARTIALLY COMPLETE, MINIMALLY TESTED

Allow switches to be turned on/off via LAN API, publish status changes from WS API to MQTT. Uses HTTP API to identify devices.

MQTT wrapper/interface to https://www.npmjs.com/package/ewelink-api-next

Copy config.example.yml somewhere and edit.

Run

```
CONFIG_PATH=config.yml node main
```

Turn switches on/off/toggle by sending to:

`ewelink/set/{deviceid}/{toggle|on|off}`

eg: `ewelink/set/10005ef2e1/toggle`

Listen for changes on

`ewelink/status/{deviceid}` - contains update details

`ewelink/status/{deviceid}/switch` - contains the updated details in the switch parameter, eg "on" or "off"

`ewelink/status/{deviceid}/switch/on`
`ewelink/status/{deviceid}/switch/off`
