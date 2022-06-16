# ewelink-mqtt

PARTIALLY COMPLETE, MINIMALLY TESTED

MQTT wrapper/interface to https://www.npmjs.com/package/ewelink-api

NOTE: ewelink-api has a lot of updates since this was written, including LAN mode. Will hopefully update to v3 of this soon. I don't have many ewelink devices to test any more however.

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
