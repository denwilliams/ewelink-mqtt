# ewelink-mqtt

THIS IS A FIRST DRAFT - HAS NOT BEEN TESTED

MQTT interface to https://www.npmjs.com/package/ewelink-api

Copy config.example.yml somewhere and edit.

Run

```
CONFIG_PATH=config.yml node main
```

Turn switches on/off/toggle by sending to:

`ewelink/set/{deviceid}/{toggle|on|off}`

eg: `ewelink/set/10005ef2e1/toggle`

Listen for changes on

`ewelink/status/{deviceid}` - device details on change

`ewelink/status/{deviceid}/switch` - contains the value in the switch parameter, eg "on" or "off"

`ewelink/status/{deviceid}/switch/on`
`ewelink/status/{deviceid}/switch/off`
