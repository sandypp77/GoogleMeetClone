<script>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "NoMatch",
  components: {
    FontAwesomeIcon,
  },
};
</script>

<template>
  <div class="no-match">
    <div class="no-match__content">
      <h2>Invalid video call name.</h2>
      <div class="action-btn">
        <Link class="btn" to="/"> Return to home screen </Link>
      </div>
    </div>
  </div>
</template>

<style>
.no-match .no-match__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
}
.no-match .no-match__content h2 {
  font-size: 38px;
  font-weight: 300;
}
.no-match .no-match__content .btn {
  cursor: pointer;
  font-size: 16px;
  padding: 15px;
  border: none;
  outline: none;
  background: none;
  border-radius: 5px;
  text-decoration: none;
}
</style>
