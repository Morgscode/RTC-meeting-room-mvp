"use strict";

const meetingModule = (async function () {
  const qs = new URLSearchParams(window.location.search);
  const user1 = document.querySelector("#user-1");
  const user2 = document.querySelector("#user-2");
  const cameraToggle = document.querySelector("#camera-toggle");
  const micToggle = document.querySelector("#mic-toggle");
  const servers = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };
  let localStream;
  let remoteStream;
  let peerConnection;

  if (!socket) {
    alert("there was a problem connecting to the server");
    return false;
  }

  if (!qs.get("username") || !qs.get("room")) {
    alert("there was a problem joining the room");
    return false;
  }

  function createUser() {
    const user = {
      username: qs.get("username"),
      room: qs.get("room"),
    };
    return user;
  }

  async function setupLocalStream() {
    if ("mediaDevices" in navigator) {
      const devices = {};
      const userDevices = await navigator.mediaDevices.enumerateDevices();
      userDevices.forEach((device) => {
        switch (device.kind) {
          case "videoinput":
            devices["video"] = true;
            break;
          case "audioinput":
            devices["audio"] = true;
            break;
        }
      });
      localStream = await navigator.mediaDevices.getUserMedia(devices);
      user1.srcObject = localStream;
    }
  }

  async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    user2.srcObject = remoteStream;

    if (!localStream) {
      await setupLocalStream();
    }

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (track) => {
      track.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (icecandidate) => {
      if (icecandidate.candidate) {
        socket.emit("meeting:newIceCandidate", icecandidate.candidate);
      }
    };
  }

  async function createOffer() {
    await createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("meeting:newMeetingOffer", offer);
  }

  async function createAnswer(offer) {
    await createPeerConnection();
    await peerConnection.setRemoteDescription(offer.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("meeting:newMeetingAnswer", answer);
  }

  async function handleUserJoined(user) {
    await createOffer();
  }

  async function handleIceCandidate(icecandidate) {
    if (peerConnection) {
      await peerConnection.addIceCandidate(icecandidate.icecandidate);
    }
  }

  async function handleMeetingOffer(offer) {
    // console.log("peer offer: ", offer);
    if (offer) {
      createAnswer(offer);
    }
  }

  async function handleMeetingAnswer(answer) {
    // console.log("peer answer: ", answer);
    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(answer.answer);
    }
  }

  async function toggleCamera() {
    let video = await localStream
      .getTracks()
      .find((track) => track.kind === "video");
    if ("enabled" in video) {
      video.enabled = !video.enabled;
    }
  }

  async function toggleMic() {
    let audio = await localStream
      .getTracks()
      .find((track) => track.kind === "audio");
    if ("enabled" in audio) {
      audio.enabled = !audio.enabled;
    }
  }

  async function init() {
    const user = createUser();
    await setupLocalStream();
    socket.on("meeting:userJoined", handleUserJoined);
    socket.on("meeting:meetingOffer", handleMeetingOffer);
    socket.on("meeting:iceCandidate", handleIceCandidate);
    socket.on("meeting:meetingAnswer", handleMeetingAnswer);
    socket.emit("meeting:newUserJoined", user);
    cameraToggle.addEventListener("click", toggleCamera);
    micToggle.addEventListener("click", toggleMic);
  }
  init();
})();
