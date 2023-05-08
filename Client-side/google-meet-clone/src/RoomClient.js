const mediaType = {
  audio: "audioType",
  video: "videoType",
  screen: "screenType",
};
const _EVENTS = {
  exitRoom: "exitRoom",
  openRoom: "openRoom",
  startVideo: "startVideo",
  stopVideo: "stopVideo",
  startAudio: "startAudio",
  stopAudio: "stopAudio",
  startScreen: "startScreen",
  stopScreen: "stopScreen",
};

export default class RoomClient {
  constructor(
    screenMediaEl,
    localMediaEl,
    remoteVideoEl,
    remoteAudioEl,
    mediasoupClient,
    socket,
    room_id,
    name,
    successCallback
  ) {
    this.name = name;
    this.screenMediaEl = screenMediaEl;
    this.localMediaEl = localMediaEl;
    this.remoteVideoEl = remoteVideoEl;
    this.remoteAudioEl = remoteAudioEl;
    this.mediasoupClient = mediasoupClient;

    this.socket = socket;
    this.producerTransport = null;
    this.consumerTransport = null;
    this.device = null;
    this.room_id = room_id;

    this.isVideoOnFullScreen = false;
    this.isDevicesVisible = false;

    this.consumers = new Map();
    this.producers = new Map();
    this.pastProducers = new Map();
    this.pastConsumers = new Map();
    this.consumersList = new Map();

    this.usersList = new Map();

    this.type = null;

    console.log("Mediasoup client", mediasoupClient);

    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map();

    this._isOpen = false;
    this.eventListeners = new Map();

    Object.keys(_EVENTS).forEach(
      function (evt) {
        this.eventListeners.set(evt, []);
      }.bind(this)
    );

    this.createRoom(room_id).then(
      async function () {
        await this.join(name, room_id);
        this.initSockets();
        this._isOpen = true;
        successCallback();
      }.bind(this)
    );
  }

  ////////// INIT /////////

  async createRoom(room_id) {
    await this.socket
      .request("createRoom", {
        room_id,
      })
      .catch((err) => {
        console.log("Create room error:", err);
      });
  }

  async join(name, room_id) {
    this.socket
      .request("join", {
        name,
        room_id,
      })
      .then(
        async function (e) {
          console.log("Joined to room", e);
          const data = await this.socket.request("getRouterRtpCapabilities");
          let device = await this.loadDevice(data);
          this.device = device;
          await this.initTransports(device);
          this.socket.emit("getProducers");
        }.bind(this)
      )
      .catch((err) => {
        console.log("Join error:", err);
      });
  }

  async loadDevice(routerRtpCapabilities) {
    let device;
    try {
      device = new this.mediasoupClient.Device();
    } catch (error) {
      if (error.name === "UnsupportedError") {
        console.error("Browser not supported");
        alert("Browser not supported");
      }
      console.error(error);
    }
    await device.load({
      routerRtpCapabilities,
    });
    return device;
  }

  async initTransports(device) {
    // init producerTransport
    {
      const data = await this.socket.request("createWebRtcTransport", {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities,
      });

      if (data.error) {
        console.error(data.error);
        return;
      }

      this.producerTransport = device.createSendTransport(data);

      this.producerTransport.on(
        "connect",
        async function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request("connectTransport", {
              dtlsParameters,
              transport_id: data.id,
            })
            .then(callback)
            .catch(errback);
        }.bind(this)
      );

      this.producerTransport.on(
        "produce",
        async function ({ kind, rtpParameters }, callback, errback) {
          try {
            let type = this.type;
            const { producer_id } = await this.socket.request("produce", {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters,
              type,
            });
            callback({
              id: producer_id,
            });
          } catch (err) {
            errback(err);
          }
        }.bind(this)
      );

      this.producerTransport.on(
        "connectionstatechange",
        function (state) {
          switch (state) {
            case "connecting":
              break;

            case "connected":
              //localVideo.srcObject = stream
              break;

            case "failed":
              this.producerTransport.close();
              break;

            default:
              break;
          }
        }.bind(this)
      );
    }

    // init consumerTransport
    {
      const data = await this.socket.request("createWebRtcTransport", {
        forceTcp: false,
      });

      if (data.error) {
        console.error(data.error);
        return;
      }

      // only one needed
      this.consumerTransport = device.createRecvTransport(data);
      this.consumerTransport.on(
        "connect",
        function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request("connectTransport", {
              transport_id: this.consumerTransport.id,
              dtlsParameters,
            })
            .then(callback)
            .catch(errback);
        }.bind(this)
      );

      this.consumerTransport.on(
        "connectionstatechange",
        async function (state) {
          switch (state) {
            case "connecting":
              break;

            case "connected":
              //remoteVideo.srcObject = await stream;
              //await socket.request('resume');
              break;

            case "failed":
              this.consumerTransport.close();
              break;

            default:
              break;
          }
        }.bind(this)
      );
    }
  }

  initSockets() {
    this.socket.on(
      "consumerClosed",
      function ({ consumer_id }) {
        console.log("Closing consumer:", consumer_id);
        this.removeConsumer(consumer_id);
      }.bind(this)
    );

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on(
      "newProducers",
      async function (data) {
        console.log("New producers", data);
        for (let { producer_id, name, usersId, type } of data) {
          console.log("type", type);
          await this.consume(producer_id, name, usersId, type);
        }
        await this.produce(mediaType.audio, "");
        await this.produce(mediaType.video, "");
      }.bind(this)
    );

    this.socket.on(
      "disconnect",
      function () {
        this.exit(true);
      }.bind(this)
    );
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null) {
    let mediaConstraints = {};
    let audio = false;
    let screen = false;
    this.type = type;
    switch (type) {
      case mediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId,
          },
          video: false,
        };
        audio = true;
        break;
      case mediaType.video:
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920,
            },
            height: {
              min: 400,
              ideal: 1080,
            },
            deviceId: deviceId,
            aspectRatio: {
              ideal: 1.7777777778,
            },
          },
        };
        break;
      case mediaType.screen:
        mediaConstraints = false;
        screen = true;
        break;
      default:
        return;
    }
    if (!this.device.canProduce("video") && !audio) {
      console.error("Cannot produce video");
      return;
    }
    if (this.producerLabel.has(type)) {
      console.log("Producer already exists for this type " + type);
      return;
    }
    console.log("Mediacontraints:", mediaConstraints);
    let stream;
    try {
      stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log(navigator.mediaDevices.getSupportedConstraints());

      const track = audio
        ? stream.getAudioTracks()[0]
        : stream.getVideoTracks()[0];
      const params = {
        track,
      };
      if (!audio && !screen) {
        params.encodings = [
          {
            rid: "r0",
            maxBitrate: 100000,
            //scaleResolutionDownBy: 10.0,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r1",
            maxBitrate: 300000,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r2",
            maxBitrate: 900000,
            scalabilityMode: "S1T3",
          },
        ];
        params.codecOptions = {
          videoGoogleStartBitrate: 1000,
        };
      }
      let producer = await this.producerTransport.produce(params, screen);

      console.log("Producer", producer);

      this.producers.set(producer.id, producer);

      let elem, elemClass, element;
      if (!audio) {
        element = document.getElementById("videoMedia");
        if (!screen) {
          if (this.localMediaEl.querySelector(".localMedia") === null) {
            elemClass = document.createElement("div");
            elemClass.setAttribute("class", "webcam localMedia webcam-size");
            elemClass.style.order = 2;
          } else {
            elemClass = document.querySelector(".localMedia");
          }
        } else {
          if (this.localMediaEl.querySelector(".screenMedia") === null) {
            elemClass = document.createElement("div");
            elemClass.setAttribute("class", "screenMedia");
            elemClass.style.order = 1;
          } else {
            elemClass = document.querySelector(".screenMedia");
          }
        }
        elem = document.createElement("video");
        elem.srcObject = stream;
        elem.id = producer.id;
        elem.playsinline = false;
        elem.autoplay = true;
        elem.className = "vid";
        elemClass.appendChild(elem);
        if (!screen) {
          this.localMediaEl.appendChild(elemClass);
        } else {
          this.screenMediaEl.appendChild(elemClass);
        }
        this.handleFS(elem.id);
        this.videoArranger();
      }

      producer.on("trackended", () => {
        console.log("Trackended");
        this.closeProducer(type);
      });

      producer.on("transportclose", () => {
        console.log("Producer transport close");
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop();
          });
          elem.parentNode.removeChild(elem);
        }
        this.producers.delete(producer.id);
      });

      producer.on("close", () => {
        console.log("Closing producer");
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop();
          });
          elem.parentNode.removeChild(elem);
        }
        this.producers.delete(producer.id);
      });

      this.producerLabel.set(type, producer.id);

      switch (type) {
        case mediaType.audio:
          this.event(_EVENTS.startAudio);
          break;
        case mediaType.video:
          this.event(_EVENTS.startVideo);
          break;
        case mediaType.screen:
          this.event(_EVENTS.startScreen);
          break;
        default:
          return;
      }
    } catch (err) {
      console.log("Produce error:", err);
    }
  }

  async consume(producer_id, name, usersId, type) {
    //let info = await this.roomInfo()
    this.getConsumeStream(producer_id).then(
      function ({ consumer, stream, kind }) {
        this.consumers.set(consumer.id, consumer);
        let elem, elemClass;
        if (kind === "video") {
          let element = document.querySelectorAll(`.${type}`);
          if (element.length >= 1) {
            element.forEach((elems) => {
              if (elems.id !== usersId) {
                elemClass = document.createElement("div");
                if (type === mediaType.screen) {
                  elemClass.setAttribute(
                    "class",
                    ` remoteMedia screenMedia ${type}`
                  );
                } else {
                  elemClass.setAttribute(
                    "class",
                    ` webcam remoteMedia webcam-size ${type}`
                  );
                }
                elemClass.id = usersId;
              } else {
                elemClass = elems;
              }
            });
          } else {
            elemClass = document.createElement("div");
            if (type === mediaType.screen) {
              elemClass.setAttribute(
                "class",
                ` remoteMedia screenMedia ${type}`
              );
            } else {
              elemClass.setAttribute(
                "class",
                ` webcam remoteMedia webcam-size ${type}`
              );
            }
            elemClass.id = usersId;
          }
          this.usersList.set(usersId, consumer.id);
          elem = document.createElement("video");
          elem.srcObject = stream;
          elem.id = consumer.id;
          elem.playsinline = false;
          elem.autoplay = true;
          elem.className = "vid";
          elemClass.appendChild(elem);
          if (type === mediaType.screen) {
            elemClass.style.order = 1;
            this.screenMediaEl.appendChild(elemClass);
          } else {
            elemClass.style.order = 3;
            this.remoteVideoEl.appendChild(elemClass);
          }

          this.handleFS(elem.id);
          this.videoArranger();
        } else {
          elem = document.createElement("audio");
          elem.srcObject = stream;
          elem.id = consumer.id;
          elem.playsinline = false;
          elem.autoplay = true;
          this.remoteAudioEl.appendChild(elem);
        }

        consumer.on(
          "trackended",
          function () {
            this.removeConsumer(consumer.id);
          }.bind(this)
        );

        consumer.on(
          "transportclose",
          function () {
            this.removeConsumer(consumer.id);
          }.bind(this)
        );
      }.bind(this)
    );
  }

  async getConsumeStream(producerId) {
    const { rtpCapabilities } = this.device;
    const data = await this.socket.request("consume", {
      rtpCapabilities,
      consumerTransportId: this.consumerTransport.id, // might be
      producerId,
    });
    const { id, kind, rtpParameters } = data;

    let codecOptions = {};
    const consumer = await this.consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
    });

    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    return {
      consumer,
      stream,
      kind,
    };
  }

  closeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log("There is no producer for this type " + type);
      return;
    }

    let producer_id = this.producerLabel.get(type);
    console.log("Close producer", producer_id);

    this.socket.emit("producerClosed", {
      producer_id,
      type,
    });

    this.producers.get(producer_id).close();
    this.producers.delete(producer_id);
    this.producerLabel.delete(type);

    if (type !== mediaType.audio) {
      let elem = document.getElementById(producer_id);
      elem.srcObject.getTracks().forEach(function (track) {
        track.stop();
      });
      if (type === mediaType.screen) {
        elem.parentElement.remove();
      }
      elem.parentNode.removeChild(elem);
      this.videoArranger();
    }

    switch (type) {
      case mediaType.audio:
        this.event(_EVENTS.stopAudio);
        break;
      case mediaType.video:
        this.event(_EVENTS.stopVideo);
        break;
      case mediaType.screen:
        this.event(_EVENTS.stopScreen);
        break;
      default:
        return;
    }
  }

  pauseProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log("There is no producer for this type " + type);
      return;
    }

    let producer_id = this.producerLabel.get(type);
    this.producers.get(producer_id).pause();
  }

  resumeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log("There is no producer for this type " + type);
      return;
    }

    let producer_id = this.producerLabel.get(type);
    this.producers.get(producer_id).resume();
  }

  removeConsumer(consumer_id) {
    let elem = document.getElementById(consumer_id);
    if (elem != null) {
      elem.srcObject.getTracks().forEach(function (track) {
        track.stop();
      });
      if (elem.parentElement.classList.contains("screenType")) {
        elem.parentElement.remove();
      }

      elem.parentNode.removeChild(elem);
    }
    this.consumers.delete(consumer_id);
    this.videoArranger();
  }

  exit(offline = false) {
    let clean = function () {
      this._isOpen = false;
      this.consumerTransport.close();
      this.producerTransport.close();
      this.socket.off("disconnect");
      this.socket.off("newProducers");
      this.socket.off("consumerClosed");
    }.bind(this);

    if (!offline) {
      this.socket
        .request("exitRoom")
        .then((e) => console.log(e))
        .catch((e) => console.warn(e))
        .finally(
          function () {
            clean();
          }.bind(this)
        );
    } else {
      clean();
    }

    this.event(_EVENTS.exitRoom);
  }

  videoArranger() {
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    let screenWidthBase = (window.innerWidth * 35) / 100;
    let screenHeightBase = (window.innerHeight * 80) / 100;
    let container = document.querySelector(".video-container");
    let Element = document.querySelectorAll(".webcam");
    let parentElem = document.getElementById("videoMedia");
    let screenElem = document.getElementById("screenMedia");
    let ElemLength = Element.length;
    let widthCalc = null;
    let columns = null;
    let rows = null;
    Element.forEach((elem) => {
      if (elem.classList.contains("webcam-size")) {
        if (container.querySelector(".screenMedia") === null) {
          if (ElemLength > 1 && ElemLength <= 4) {
            columns = 2;
            widthCalc = screenWidth / columns - (screenWidth * 5) / 100;
          } else if (ElemLength > 4 && ElemLength <= 6) {
            columns = 3;
            widthCalc = screenWidth / columns - (screenWidth * 5) / 100;
          } else if (ElemLength > 6 && ElemLength <= 9) {
            columns = 3;
            widthCalc = screenWidth / columns - (screenWidth * 5) / 100;
          } else if (ElemLength > 9) {
            columns = 4;
            widthCalc = screenWidth / columns - (screenWidth * 5) / 100;
          } else {
            columns = 1;
            widthCalc = (screenWidth * 84) / 100;
          }

          if (ElemLength % columns > 0) {
            rows = ~~(ElemLength / columns) + 1;
          } else {
            rows = ~~(ElemLength / columns);
          }

          if (screenHeight - 100 < ((widthCalc * 48) / 100) * rows) {
            elem.style.height =
              screenHeight / rows - (screenHeight * 10) / 100 + "px";
            elem.style.width =
              (screenHeight / rows - (screenHeight * 10) / 100) * (100 / 48) +
              "px";
          } else {
            elem.style.width = widthCalc + "px";
            elem.style.height = (widthCalc * 48) / 100 + "px";
          }
        } else {
          if (ElemLength > 1 && ElemLength <= 4) {
            columns = 1;
            widthCalc = screenWidthBase - (screenWidthBase * 5) / 100;
          } else if (ElemLength > 4 && ElemLength <= 6) {
            columns = 2;
            widthCalc = screenWidthBase - (screenWidthBase * 5) / 100;
          } else if (ElemLength > 6 && ElemLength <= 9) {
            columns = 2;
            widthCalc = screenWidthBase - (screenWidthBase * 5) / 100;
          } else if (ElemLength > 9) {
            columns = 4;
            widthCalc = screenWidthBase - (screenWidthBase * 5) / 100;
          } else {
            columns = 1;
            widthCalc = (screenWidth * 84) / 100;
          }

          if (ElemLength % columns > 0) {
            rows = ~~(ElemLength / columns) + 1;
          } else {
            rows = ~~(ElemLength / columns);
          }

          if (ElemLength > 1 && ElemLength <= 4) {
            elem.style.height = screenHeightBase / rows + "px";
            elem.style.width = (widthCalc * 75) / 100 + "px";
          } else if (ElemLength > 4) {
            elem.style.height =
              screenHeight / rows - (screenHeight * 10) / 100 + "px";
            elem.style.width =
              ((screenHeight / rows - (screenHeight * 10) / 100) * (100 / 48)) /
                columns +
              "px";
          } else if (ElemLength === 1) {
            elem.style.height = screenHeightBase / 2 + "px";
            elem.style.width = (widthCalc * 75) / 100 + "px";
          }
        }
      }
    });
  }

  ///////  HELPERS //////////

  async roomInfo() {
    let info = await this.socket.request("getMyRoomInfo");
    return info;
  }

  static get mediaType() {
    return mediaType;
  }

  event(evt) {
    if (this.eventListeners.has(evt)) {
      this.eventListeners.get(evt).forEach((callback) => callback());
    }
  }

  on(evt, callback) {
    this.eventListeners.get(evt).push(callback);
  }

  //////// GETTERS ////////

  isOpen() {
    return this._isOpen;
  }

  static get EVENTS() {
    return _EVENTS;
  }

  //////// UTILITY ////////

  copyURL() {
    let tmpInput = document.createElement("input");
    document.body.appendChild(tmpInput);
    tmpInput.value = window.location.href;
    tmpInput.select();
    document.execCommand("copy");
    document.body.removeChild(tmpInput);
    console.log("URL copied to clipboard 👍");
  }

  showDevices() {
    if (!this.isDevicesVisible) {
      reveal(devicesList);
      this.isDevicesVisible = true;
    } else {
      hide(devicesList);
      this.isDevicesVisible = false;
    }
  }

  handleFS(id) {
    let videoPlayer = document.getElementById(id);
    videoPlayer.addEventListener("fullscreenchange", (e) => {
      if (videoPlayer.controls) return;
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        videoPlayer.style.pointerEvents = "auto";
        this.isVideoOnFullScreen = false;
      }
    });
    videoPlayer.addEventListener("webkitfullscreenchange", (e) => {
      if (videoPlayer.controls) return;
      let webkitIsFullScreen = document.webkitIsFullScreen;
      if (!webkitIsFullScreen) {
        videoPlayer.style.pointerEvents = "auto";
        this.isVideoOnFullScreen = false;
      }
    });
    videoPlayer.addEventListener("click", (e) => {
      if (videoPlayer.controls) return;
      if (!this.isVideoOnFullScreen) {
        if (videoPlayer.requestFullscreen) {
          videoPlayer.requestFullscreen();
        } else if (videoPlayer.webkitRequestFullscreen) {
          videoPlayer.webkitRequestFullscreen();
        } else if (videoPlayer.msRequestFullscreen) {
          videoPlayer.msRequestFullscreen();
        }
        this.isVideoOnFullScreen = true;
        videoPlayer.style.pointerEvents = "none";
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isVideoOnFullScreen = false;
        videoPlayer.style.pointerEvents = "auto";
      }
    });
  }
}
