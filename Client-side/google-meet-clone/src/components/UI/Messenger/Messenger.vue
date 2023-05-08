<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import callpage from "../../../stores/callpage";
import { onMounted, defineExpose } from "vue";
let sectionState = false;
let messages = [];

const emit = defineEmits(["sendMessage"]);

const props = defineProps({
  text: String,
  message: Array,
});

function updateChat() {
  messages = messages.concat(
    JSON.parse(JSON.stringify(callpage.value.messages))
  );
  props.message = messages;
}

function updateParticipant() {
  const Element = document.getElementById("peopleSection");
  Element.innerHTML = callpage.value.usersList
    .map(
      (i) =>
        `<div class="participant"><svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z"/></svg>${i.username}</div>`
    )
    .join("");
}

function sectionChanged() {
  sectionState = !sectionState;
  if (sectionState) {
    people.className = "tab active";
    chat.className = "tab";
    peopleSection.className = "people-section";
    chatSection.className = "hide";
  } else {
    people.className = "tab";
    chat.className = "tab active";
    peopleSection.className = "hide";
    chatSection.className = "chat-section";
  }
}

function sendMessage() {
  addMessage();
  props.text = "";
  // showChat();
}
function addMessage() {
  const message = {
    id: new Date().getTime(),
    text: props.text,
    user: callpage.value.username,
  };
  messages = messages.concat(message);
  props.message = messages;
  console.log("send", props.message);
  callpage.value.message = message;
  emit("sendMessage");
}

defineExpose({
  updateParticipant,
  updateChat,
});
</script>

<template>
  <div class="messenger-container" v-show="callpage.messengerIsOpened">
    <div class="messenger-header">
      <h3>Meeting details</h3>
      <div @click="callpage.setMessengerIsOpened">
        <FontAwesomeIcon class="icon" icon="fa-solid fa-times" />
      </div>
    </div>

    <div class="messenger-header-tabs">
      <div class="tab" @click="sectionChanged" id="people">
        <font-awesome-icon icon="fa-solid fa-user-group" class="icon" />
        <p>People (1)</p>
      </div>
      <div class="tab active" @click="sectionChanged" id="chat">
        <font-awesome-icon icon="fa-solid fa-message" class="icon" />
        <p>Chat</p>
      </div>
    </div>

    <div class="hide" id="peopleSection"></div>

    <div class="chat-section" id="chatSection">
      <div v-for="message in props.message" :key="message.id" class="chat-text">
        <div
          class="all-message"
          :style="[
            message.user === callpage.username
              ? { 'flex-direction': 'row-reverse' }
              : { 'flex-direction': 'row' },
          ]"
        >
          <!-- <img src="../assets/icons8-person-skin-type-7-48.png" alt="" /> -->
          <div class="message">
            <div class="user-text">{{ message.user }}</div>
            <div class="message-text">{{ message.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="send-msg-section">
      <input
        v-model="props.text"
        placeholder="Send a message to everyone"
        v-on:keyup.enter="sendMessage()"
      />
      <div @click="sendMessage()">
        <font-awesome-icon icon="fa-solid fa-paper-plane" />
      </div>
    </div>
  </div>
</template>

<style>
.messenger-container {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #fff;
  height: calc(100vh - 100px);
  width: 360px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.5rem;
}
.messenger-container .messenger-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
}
.messenger-container .messenger-header h3 {
  margin: 0;
  font-weight: 400;
}
.messenger-container .messenger-header .icon {
  cursor: pointer;
  font-size: 20px;
}
.messenger-container .messenger-header-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}
.messenger-container .messenger-header-tabs .tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: #555;
}
.messenger-container .messenger-header-tabs .tab p {
  margin-left: 10px;
}
.active {
  border-bottom: 2px solid #04796a;
  color: #04796a;
}
.messenger-container .messenger-header-tabs .tab:hover {
  cursor: pointer;
  background: rgba(0, 121, 107, 0.039);
}
.messenger-container .chat-section,
.people-section {
  padding: 20px;
  flex: 1;
  overflow-y: scroll;
}
.messenger-container .chat-section .chat-block {
  margin-bottom: 30px;
}
.messenger-container .chat-section .chat-block .sender {
  font-weight: 500;
  font-size: 14px;
}
.messenger-container .chat-section .chat-block .sender small {
  margin-left: 5px;
  font-weight: 300;
}
.messenger-container .chat-section .chat-block .msg {
  margin: 0;
  padding-top: 5px;
  color: #555;
  font-size: 14px;
}
.messenger-container .send-msg-section {
  padding: 20px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #555;
}
.messenger-container .send-msg-section input {
  padding: 5px;
  border: none;
  outline: none;
  border-bottom: 1px solid #eee;
  width: 80%;
}
.messenger-container .send-msg-section .icon {
  cursor: pointer;
}
.messenger-container .send-msg-section .icon:hover {
  color: #04796a;
}
.hide {
  display: none;
}

.all-message {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.participant {
  display: flex;
  justify-content: left;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
}

.icon {
  width: 30px;
}
.participant {
  font-size: 1.125rem;
}
.people-section{
  gap: 0.5rem;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-text {
  display: inline-block;
  font-size: 1rem;
  font-weight: 550;
  line-height: 1.25;
  padding-bottom: 0.1875rem;
  padding-top: 0.25rem;
  padding-right: 0.5rem;
  word-wrap: break-word;
}
.message-text {
  box-sizing: border-box;
  flex: 1;
  min-height: 2.25rem;
  overflow-y: auto;
  padding-bottom: 0.5rem;
  user-select: text;
  width: 100%;
  font-size: 0.8125rem;
}
</style>
