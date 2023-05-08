<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import callpage from "../../../stores/callpage";
</script>

<template>
  <div class="frame-header">
    <div class="header-items icon-block">
        <font-awesome-icon icon="fa-solid fa-user-group" class="icon" />
    </div>
    <div class="header-items icon-block" @click="callpage.setMessengerIsOpened">
        <font-awesome-icon icon="fa-solid fa-message" class="icon" />
      <!-- {!isMessenger && messageAlert.alert && ( -->
      <span class="alert-circle-icon"></span>
      <!-- )} -->
    </div>
    <div class="header-items date-block">{currentTime}</div>
    <div class="header-items icon-block">
        <font-awesome-icon icon="fa-solid fa-circle-user" class="icon profile" />
    </div>
  </div>
</template>

<style>
.frame-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 350px;
  position: absolute;
  top: 0;
  right: 0;
  background: #fff;
  border-radius: 0 0 0 10px;
  overflow: hidden;
}
.frame-header .header-items {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  flex: 1;
  border-right: 1px solid #f5f5f5;
  position: relative;
}
.frame-header .header-items .alert-circle-icon {
  position: absolute;
  background: #04796a;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
  top: 10px;
  right: 20px;
}
.frame-header .header-items.date-block {
  font-size: 22px;
  color: #5f6368;
  min-width: 120px;
  font-weight: 400;
}
.frame-header .header-items.icon-block .icon {
  color: #505357;
  font-size: 22px;
}
.frame-header .header-items.icon-block .icon.profile {
  font-size: 32px;
  color: #04796a;
}
.frame-header .header-items.icon-block:hover {
  cursor: pointer;
  background: #eee;
}
</style>
