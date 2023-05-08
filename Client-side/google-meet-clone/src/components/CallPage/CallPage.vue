<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import CallPageHeader from "../../components/UI/CallPageHeader/CallPageHeader.vue";
import CallPageFooter from "../../components/UI/CallPageFooter/CallPageFooter.vue";
import MeetingInfo from "../../components/UI/MeetingInfo/MeetingInfo.vue";
import Messenger from "../../components/UI/Messenger/Messenger.vue";
import io from "socket.io-client";
import RoomClient from "../../RoomClient.js";
import MediasoupClient from "mediasoup-client";
import callpage from "../../stores/callpage";
import { useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref } from "vue";

const socket = io("https://" + location.host);
let isEnumerateDevices = false;
const route = useRoute();
const router = useRouter();
let nameInput = route.params.nameInput;
let roomIdInput = route.params.roomIdInput;
let rc = null;
let videoSelect = "";
let audioSelect = "";
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
let usersList = [];
const messenger = ref(null);
let messages = [];

onMounted(() => {
  callpage.value.username = nameInput;

  socket.request = function request(type, data = {}) {
    return new Promise((resolve, reject) => {
      socket.emit(type, data, (data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data);
        }
      });
    });
  };

  socket.on("message:received", (data) => {
    messages = messages.concat(data);
    console.log(messages)
    callpage.value.messages = data;
    messenger.value.updateChat();
  });

  socket.on("usersList", (data) => {
    usersList = data;
    callpage.value.usersList = usersList;
    messenger.value.updateParticipant();
  });

  socket.on("exitUser", (usersId) => {
    document.getElementById(usersId).remove();
  });

  socket.on("newJoined", () => {
    handleResize();
  });

  window.addEventListener("resize", handleResize);
  handleResize();

  joinRoom(nameInput, roomIdInput);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
function handleResize() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
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

        // if (screenHeight - 100 < ((widthCalc * 48) / 100) * rows) {
        //   elem.style.height =
        //     screenHeight / rows - (screenHeight * 10) / 100 + "px";
        //   elem.style.width =
        //     (screenHeight / rows - (screenHeight * 10) / 100) * (100 / 48) +
        //     "px";
        // } else {
        //   elem.style.width = widthCalc + "px";
        //   elem.style.height = (widthCalc * 48) / 100 + "px";
        // }
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
function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log("Already connected to a room");
  } else {
    initEnumerateDevices();
    rc = new RoomClient(
      screenMedia,
      videoMedia,
      videoMedia,
      remoteAudios,
      MediasoupClient,
      socket,
      room_id,
      name,
      roomOpen
    );
    addListeners();
  }
}
function roomOpen() {
  callpage.value.startAudioButton = false;
  callpage.value.stopAudioButton = true;
  callpage.value.startVideoButton = false;
  callpage.value.stopVideoButton = true;
  callpage.value.startScreenButton = true;
  callpage.value.stopScreenButton = false;
  callpage.value.exitButton = true;
  callpage.value.copyButton = true;
  callpage.value.devicesButton = true;
}
function addListeners() {
  rc.on(RoomClient.EVENTS.exitRoom, () => {
    console.log("Exit Room");
    router
      .push({
        name: "HomePage",
      })
      .catch((err) => {
        throw new Error(`Problem handling something: ${err}.`);
      });
  });
}
function hide(elem) {
  elem.className = "hidden";
}
function reveal(elem) {
  elem.className = "";
}
function initEnumerateDevices() {
  // Many browsers, without the consent of getUserMedia, cannot enumerate the devices.
  if (isEnumerateDevices) return;

  const constraints = {
    audio: true,
    video: true,
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      enumerateDevices();
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    })
    .catch((err) => {
      console.error("Access denied for audio/video: ", err);
    });
}
function enumerateDevices() {
  // Load mediaDevice options
  navigator.mediaDevices.enumerateDevices().then((devices) =>
    devices.forEach((device) => {
      let el = null;
      if ("audioinput" === device.kind) {
        el = audioSelect;
      } else if ("videoinput" === device.kind) {
        el = videoSelect;
      }
      if (!el) return;

      let option = document.createElement("option");
      option.value = device.deviceId;
      option.innerText = device.label;
      el.appendChild(option);
      isEnumerateDevices = true;
    })
  );
}
function sendMessage(){
  socket.emit('message', callpage.value.message)
}
</script>

<template>
  <div class="callpage-container">
    <div class="video-container">
      <div class="screenVideo" id="screenMedia"></div>
      <div id="videoMedia" class="videoClass"></div>
    </div>
    <div id="remoteAudios"></div>
    <!-- <CallPageHeader /> -->
    <CallPageFooter
      @startAudio="rc.produce(RoomClient.mediaType.audio, audioSelect)"
      @stopAudio="rc.closeProducer(RoomClient.mediaType.audio)"
      @startVideo="rc.produce(RoomClient.mediaType.video, videoSelect)"
      @stopVideo="rc.closeProducer(RoomClient.mediaType.video)"
      @startScreen="rc.produce(RoomClient.mediaType.screen)"
      @stopScreen="rc.closeProducer(RoomClient.mediaType.screen)"
      @exitButton="rc.exit()"
    />
    <MeetingInfo />
    <Messenger
      ref="messenger"
      @sendMessage="sendMessage()"
    />
  </div>
</template>

<style>
.callpage-container .video-container {
  height: calc(100% - 5rem);
  width: 100%;
  object-fit: cover;
  position: absolute;
  z-index: -1;
  background-color: #282424;
  display: flex;
  align-items: center;
}
.callpage-container .video-container .videoClass {
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
  justify-content: center;
  align-content: center;
  justify-items: center;
  align-items: center;
  grid-row-gap: 2%; */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  flex-direction: row;
  justify-content: center;
  gap: 1rem;
}
.webcam {
  /* flex: 0 0 auto; */
  border: 0;
  box-shadow: 0px;
  background-size: auto 40%;
  background-color: rgb(60, 64, 67);
  background-image: url(../../assets/circle-user-solid.svg);
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 0.5rem;
}
.screenMedia {
  position: relative;
  width: calc(70vw);
  height: calc(80vh);
  border-radius: 0.5rem;
  margin: 1rem;
}
/* .screenType{

} */
.webcam-size {
  position: relative;
  width: calc(84vw);
  height: calc(84vh);
  border-radius: 0.5rem;
}
#webcam:hover {
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.05) inset,
    0px 0px 8px rgba(82, 168, 236, 0.9);
}
.hidden {
  display: none;
}
video {
  /* flex: 100 100 auto; */
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  background-color: #131313;
  transition-duration: 0.15s;
  transition-property: opacity;
  border-radius: 0.5rem;
}
</style>
