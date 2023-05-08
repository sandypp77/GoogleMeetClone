<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "Alert",
  components: {
    FontAwesomeIcon,
  },
};
</script>

<template>
  <div class="message-alert-popup">
    <div class="alert-header">
        <font-awesome-icon icon="fa-solid fa-message" class="icon" />
      <h3>{messageAlert.payload.user}</h3>
    </div>
    <p class="alert-msg">{messageAlert.payload.msg}</p>
  </div>
</template>

<style>
.message-alert-popup {
  position: absolute;
  bottom: 100px;
  right: 10px;
  background: #fff;
  border-radius: 5px;
  padding: 15px;
  min-width: 250px;
  max-width: 250px;
}
.message-alert-popup .alert-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  color: #04796a;
}
.message-alert-popup .alert-header .icon {
  margin-right: 10px;
}
.message-alert-popup .alert-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}
.message-alert-popup .alert-msg {
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
