import { ref } from "vue";

export const callpage = ref({
  meetingDetailsIsOpened: false,
  messengerIsOpened: false,
  startAudioButton: false,
  stopAudioButton: false,
  startVideoButton: false,
  stopVideoButton: false,
  startScreenButton: false,
  stopScreenButton: false,
  exitButton: false,
  copyButton: false,
  devicesButton: false,
  usersList: [],
  messages: [],
  message: {},
  username: "",
  setMeetingDetailsIsOpened() {
    this.meetingDetailsIsOpened = !this.meetingDetailsIsOpened;
  },
  setMessengerIsOpened() {
    this.messengerIsOpened = !this.messengerIsOpened;
  },
});

export default callpage