<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import callpage from '../../../stores/callpage.js'

</script>

<template>
  <div class="meeting-info-block" v-show="callpage.meetingDetailsIsOpened">
    <div class="meeting-header">
      <h3>Your meeting's ready</h3>
      <div @click="callpage.setMeetingDetailsIsOpened()">
        <font-awesome-icon class="icon" icon="fa-solid fa-times" />
      </div>
    </div>
    <button class="add-people-btn">
      <font-awesome-icon class="icon" icon="fa-solid fa-user" />
      Add Others
    </button>
    <p class="info-text">
      Or share this meeting link with others you want in the meeting
    </p>
    <div class="meet-link">
      <span>{url}</span>
      <font-awesome-icon icon="fa-solid fa-copy" class="icon" />
    </div>
    <div class="permission-text">
        <font-awesome-icon icon="fa-solid fa-shield-halved" style="color: #153cd5;" class="icon"/>
      <p class="small-text">
        People who use this meeting link must get your permission before they
        can join.
      </p>
    </div>
    <p class="small-text">Joined as sandypoetra77@gmail.com</p>
  </div>
</template>

<style>
.meeting-info-block {
  position: absolute;
  top: 50px;
  left: 50px;
  background: #fff;
  border-radius: 10px;
  padding: 25px;
  width: 310px;
}
.meeting-info-block .meeting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #222;
}
.meeting-info-block .meeting-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
}
.meeting-info-block .meeting-header .icon {
  cursor: pointer;
  font-size: 20px;
}
.meeting-info-block .add-people-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #04796a;
  color: #fff;
  font-size: 16px;
  padding: 10px;
  border-radius: 5px;
  outline: none;
  border: none;
  margin-top: 20px;
}
.meeting-info-block .add-people-btn .icon {
  font-size: 12px;
  margin-right: 10px;
}
.meeting-info-block .info-text {
  color: #222;
  font-size: 14px;
}
.meeting-info-block .meet-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f3f5;
  padding: 15px;
  border-radius: 5px;
}
.meeting-info-block .meet-link span {
  font-size: 14px;
  font-weight: 600;
  border: none;
  outline: none;
  background: none;
  flex: 1;
  color: #555;
}
.meeting-info-block .meet-link .icon {
  cursor: pointer;
  color: #555;
}
.meeting-info-block .permission-text {
  display: flex;
  align-items: center;
  justify-content: center;
}
.meeting-info-block .permission-text .icon {
  color: #4385f4;
  font-size: 20px;
  margin-right: 10px;
}
.meeting-info-block .small-text {
  font-size: 13px;
  color: #222;
}
</style>
