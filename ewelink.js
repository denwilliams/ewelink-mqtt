//@ts-check
const eWeLink = require("ewelink-api-next").default;
const crypto = require("crypto");
const EventEmitter = require("events");

const appId = "Uw83EKZFxdif7XFXEsrpduz5YyjP7nTl";
const appSecret = "mXLOjea0woSMvK9gw7Fjsy7YlFO4iSu6";

exports.EweClient = class EweClient extends EventEmitter {
  /** @type {*} */
  userInfo = {
    user: {
      timezone: {},
      accountLevel: 10,
      countryCode: "+61",
      email: "mail+home@denwilliams.net",
      apikey: "e5bdd31c-af79-4be0-a4e5-9c3600a1decf",
      accountConsult: false,
      appForumEnterHide: false,
      appVersion: "5.10.1",
      denyRecharge: false,
      ipCountry: "AU",
    },
    at: "721830cea59cff36fe67e792c76f338f9918ddf6",
    rt: "f2ec290c33f091f6ff44c6004738dd77a0375e11",
    region: "us",
  };
  devices = {};

  constructor(
    /** @type {{account:string;password:string;areaCode:"+61";}} */
    credentials
  ) {
    super();
    this.credentials = credentials;
    this.client = new eWeLink.WebAPI({
      appId,
      appSecret,
      region: "us", // cn、us、eu、as、ir
      logObj: eWeLink.createLogger("eu"),
    });
  }

  async init() {
    await this.login();
    console.info("Logged in as", this.userInfo.user.email);
    const devices = await this.getDevices();
    for (const device of Object.values(devices)) {
      console.info(
        "Found device %s [%s]",
        device.itemData.name,
        device.itemData.deviceid
      );
    }
    this.scanLanDevices();
    this.initWs();
  }

  onMessage(handler) {
    this.on("message", handler);
  }

  async stop() {
    if (this.ws) {
      this.ws.close();
    }
  }

  async initWs() {
    const wsClient = new eWeLink.Ws({
      appId,
      appSecret,
      region: "us", // TODO: use user region
    });

    this.ws = await wsClient.Connect.create(
      {
        appId: appId,
        at: this.userInfo.at,
        region: "us",
        userApiKey: this.userInfo.user.apikey,

        // appId: wsClient?.appId || "",
        // at: wsClient.at,
        // region: "us",
        // userApiKey: wsClient.userApiKey,
      },
      (ws) => {
        console.log("WS Connected");
      },
      () => {
        console.error("WS Closed");
        this.ws = null;
        this.initWs();
      },
      (err) => {
        console.error("WS Error", err);
      },
      (ws, msg) => {
        const { type, data, target } = msg;
        if (type === "message") {
          console.debug("WS Message", data);
          if (data[0] === "{") {
            try {
              const msg = JSON.parse(data.toString());
              this.emit("message", msg);
            } catch (err) {
              console.error("Failed to parse message", err);
            }
          }
        }
      }
    );
    // ws.on("message", (msg) => {
    //   console.log("Message", msg.toString());
    // });

    // wsClient.Connect.create();

    // setTimeout(() => {
    //   wsClient.Connect.updateState("xxxx", {
    //     switch: "on",
    //   });
    // }, 5000);
  }

  async login() {
    const response = await this.client.user.login(this.credentials);
    if (response.error !== 0) {
      throw new Error(response.msg);
    }

    this.userInfo = response.data;
  }

  async getDevices() {
    const response = await this.client.device.getAllThings({
      lang: "en",
    });
    this.devices = response.data.thingList.reduce((acc, item) => {
      acc[item.itemData.deviceid] = item;
      return acc;
    }, {});
    return this.devices;
    /*
[
  {
    itemType: 2,
    itemData: {
      name: 'Pergola Music Power',
      deviceid: '10002aee24',
      apikey: 'e1a28209-08ff-4ac6-81f5-65bd5157a384',
      extra: [Object],
      brandName: 'BLue50',
      brandLogo: '',
      showBrand: true,
      productModel: 'BLue50_SX1',
      tags: [Object],
      devConfig: {},
      settings: [Object],
      family: [Object],
      sharedBy: [Object],
      devicekey: '8a5cc9af-9d45-4d53-b24d-2598c0219fd7',
      online: true,
      params: [Object],
      denyFeatures: [Array],
      isSupportGroup: true,
      isSupportedOnMP: true,
      isSupportChannelSplit: false,
      wxModelId: '05Gkq9_vqnmgylS_2UvXCQ',
      deviceFeature: {}
    },
    index: -1
  },
  {
    itemType: 2,
    itemData: {
      name: 'Electric Blanket Den',
      deviceid: '100036fcce',
      apikey: 'e1a28209-08ff-4ac6-81f5-65bd5157a384',
      extra: [Object],
      brandName: 'BLue50',
      brandLogo: '',
      showBrand: true,
      productModel: 'BLue50_SX1',
      tags: [Object],
      devConfig: {},
      settings: [Object],
      family: [Object],
      sharedBy: [Object],
      devicekey: '06481b0e-d406-4b61-830b-421e2f49cd5c',
      online: true,
      params: [Object],
      denyFeatures: [Array],
      isSupportGroup: true,
      isSupportedOnMP: true,
      isSupportChannelSplit: false,
      wxModelId: '05Gkq9_vqnmgylS_2UvXCQ',
      deviceFeature: {}
    },
    index: 0
  }
]*/
  }

  scanLanDevices() {
    if (!this.userInfo) return;

    const lanClient = new eWeLink.Lan({
      selfApikey: this.userInfo.user.apikey,
      logObj: eWeLink.createLogger("lan"),
    });

    lanClient.discovery((server) => {
      const deviceId = server.txt.id;
      const d = this.devices[deviceId];
      d.lan = server;
      console.info(
        "Discovered LAN device %s [%s] on %s",
        d.itemData.name,
        deviceId,
        server.addresses?.[0] ?? ""
      );
    });
  }

  /**
   * @param {string} deviceId
   * @param {{switch: "on" | "off"}} data
   */
  async lanSwitch(deviceId, data) {
    const device = this.devices[deviceId];
    if (!device || !device.lan) return;

    const lanClient = new eWeLink.Lan({
      selfApikey: this.userInfo.user.apikey,
      logObj: eWeLink.createLogger("lan"),
    });

    const res = await lanClient.zeroconf.switch({
      deviceId: deviceId,
      ip: device.lan.referer?.address ?? "",
      port: String(device.lan.port ?? 0),
      data,
      secretKey: md5(device.itemData.devicekey),
      iv: device.lan.txt.iv,
      encrypt: true,
    });
    if (res.error !== 0) {
      console.error("Failed to switch device %j", res);
    }
  }
};

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}
