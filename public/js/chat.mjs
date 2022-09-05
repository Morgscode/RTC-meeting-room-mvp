"use strict";

const chatModule = (function () {
  const chatForm = document.querySelector("#chat-form");
  const chatMessages = document.querySelector("#chat-messages");
  const qs = new URLSearchParams(window.location.search);

  if (!socket) {
    alert("there was a problem connecting to the server");
    return false;
  }

  if (!qs.get("username") || !qs.get("room")) {
    alert("there was a problem joining the room");
    return false;
  }

  socket.on("chat:message", (message) => {
    outputMessage(message);
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const message = data.get("message");
    const chatMessage = {
      username: qs.get("username"),
      room: qs.get("room"),
      message,
    };
    socket.emit("chat:chatMessage", chatMessage);
    e.target.reset();
  });

  function outputMessage(data) {
    const newMessage = document.createElement("div");
    newMessage.classList.add("message");
    newMessage.innerHTML = `
  <p class="meta">${data.username}<span>&nbsp;${data.time}</span></p>
  <p class="text">
    ${data.message}
  </p>`;
    chatMessages.append(newMessage);
  }
})();
