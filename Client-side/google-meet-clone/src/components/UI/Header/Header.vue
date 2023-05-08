<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "Header",
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      questionMenuState: false,
    };
  },
  methods: {
    questionMenu() {
      this.questionMenuState = !this.questionMenuState;
      console.log(this.questionMenuState);
    },
  },
};
</script>

<template>
  <div class="header">
    <div class="logo">
      <img
        src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_2x_icon_124_40_292e71bcb52a56e2a9005164118f183b.png"
      />
      <span class="help-text">Meet</span>
    </div>
    <div class="action-btn">
      <div class="question-menu-container">
        <a @click="questionMenu()">
          <font-awesome-icon
            icon="fa-solid fa-circle-question"
            class="icon-block"
          />
        </a>
        <div v-show="questionMenuState == true" class="question-menu">
          <p>
            This is a Google Meet Clone using WebRTC provide by mediasoup, and
            Socket.io
          </p>
          <p>
            Created by Sandy Pratama Poetra
          </p>
        </div>
      </div>

      <font-awesome-icon
        icon="fa-solid fa-circle-exclamation"
        class="icon-block"
      />
      <font-awesome-icon icon="fa-solid fa-gear" class="icon-block" />
    </div>
  </div>
</template>

<style>
.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 20px;
  box-sizing: border-box;
}
.header .logo {
  display: flex;
  align-items: center;
  width: 124px;
}
.header .logo img {
  width: 100%;
}
.header .logo .help-text {
  font-size: 22px;
  padding-left: 4px;
  color: #5f6368;
}
.header .action-btn {
  display: flex;
  align-items: center;
}
.header .action-btn .icon-block {
  font-size: 20px;
  padding: 10px;
  color: #5f6368;
}

.header .question-menu {
  position: absolute;
  width: 20rem;
  padding: 0 1rem 0 1rem;
  letter-spacing: 0.5px;
  font-weight: 200;
  font-size: 20px;
  top: 8%;
  right: 7.5%;
  background-color: white;
  border-radius: 0.3rem;
  box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3);
}
</style>
