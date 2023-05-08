<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import Header from "../../components/UI/Header/Header.vue";

export default {
  name: "HomePage",
  components: {
    FontAwesomeIcon,
    Header,
  },
  data() {
    return {
      nameInput: "user_" + Math.round(Math.random() * 1000),
      roomIdInput: "123",
    };
  },
  methods: {
    joinRoom() {
      this.$router
        .push({
          name: 'CallPage',
          params: {
            nameInput: this.$data.nameInput,
            roomIdInput: this.$data.roomIdInput
          }
        })
        .catch((err) => {
          throw new Error(`Problem handling something: ${err}.`);
        });
    },
  },
};
</script>

<template>
  <div class="home-page">
    <Header></Header>
    <div class="body">
      <div class="left-side">
        <div class="content">
          <h2>Premium video meetings. Now free for everyone.</h2>
          <p>
            We re-engineered the service we built for secure business meetings,
            Google Meet, to make it free and available for all.
          </p>

          <div class="form">
            <div class="action-name">
              <div class="input-block">
                <div class="input-section">
                  <font-awesome-icon
                    icon="fa-solid fa-keyboard"
                    class="icon-block"
                  />
                  <input
                    type="text"
                    id="nameInput"
                    v-model="nameInput"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>
            <div class="action-btn">
              <button class="btn">
                <font-awesome-icon
                  icon="fa-solid fa-video"
                  class="icon-block"
                />
                New Meeting
              </button>
              <div class="input-block">
                <div class="input-section">
                  <font-awesome-icon
                    icon="fa-solid fa-keyboard"
                    class="icon-block"
                  />
                  <input
                    type="text"
                    id="roomIdInput"
                    v-model="roomIdInput"
                    placeholder="Enter a code or link"
                  />
                </div>
                <button class="btn no-bg" type="button" v-on:click="joinRoom()">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="help-text"><a href="">Learn more</a> about Google Meet</div>
      </div>
      <div class="right-side">
        <div class="content">
          <img
            src="https://www.gstatic.com/meet/google_meet_marketing_ongoing_meeting_grid_427cbb32d746b1d0133b898b50115e96.jpg"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.home-page .body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.home-page .body .left-side {
  max-width: 500px;
}
.home-page .body .left-side .content h2 {
  font-size: 56px;
  font-weight: 400;
  margin: 0;
}
.home-page .body .left-side .content p {
  font-size: 18px;
  font-weight: 300;
}
.home-page .body .left-side .content .form {
  margin: 20px 0px 0px 0px;
  padding-right: 15px;
}
.home-page .body .left-side .content .action-name {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.home-page .body .left-side .content .form .action-name .input-block {
  width: 100%;
  display: flex;
  flex: 1;
}
.home-page
  .body
  .left-side
  .content
  .form
  .action-name
  .input-block
  .input-section {
  width: 100%;
  position: relative;
  margin-right: 10px;
}
.home-page
  .body
  .left-side
  .content
  .action-name
  .input-block
  .input-section
  .icon-block {
  position: absolute;
  top: 50%;
  transform: translate(10px, -50%);
  color: #5f6368;
}
.home-page
  .body
  .left-side
  .content
  .action-name
  .input-block
  .input-section
  input {
  font-size: 16px;
  height: 48px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding-left: 35px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
}

.home-page .body .left-side .content .action-btn {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.home-page .body .left-side .content .action-btn .btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 15px;
  border: none;
  outline: none;
  background: none;
  border-radius: 5px;
  background-color: #00796b;
  color: white;
  text-decoration: none;
}
.home-page .body .left-side .content .action-btn .btn .icon-block {
  padding-right: 10px;
}
.home-page .body .left-side .content .action-btn .btn:hover {
  background: #f6faf9;
}
.home-page .body .left-side .content .action-btn .input-block {
  margin-left: 20px;
  display: flex;
  flex: 1;
}
.home-page .body .left-side .content .action-btn .input-block .input-section {
  position: relative;
  margin-right: 10px;
}
.home-page
  .body
  .left-side
  .content
  .action-btn
  .input-block
  .input-section
  .icon-block {
  position: absolute;
  top: 50%;
  transform: translate(10px, -50%);
  color: #5f6368;
}
.home-page
  .body
  .left-side
  .content
  .action-btn
  .input-block
  .input-section
  input {
  font-size: 16px;
  height: 48px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding-left: 35px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
}
.home-page .body .left-side .help-text {
  margin-top: 30px;
  padding-top: 25px;
  border-top: 1px solid #ddd;
}
.home-page .body .left-side .help-text a {
  text-decoration: none;
  color: #00796b;
}
.home-page .body .right-side .content {
  border: 1px solid #eee;
  padding: 30px;
  width: 100%;
  max-width: 650px;
  border-radius: 5px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
    0 2px 6px 2px rgba(60, 64, 67, 0.149);
}
.home-page .body .right-side .content img {
  width: 100%;
  border-radius: 5px;
}
</style>
