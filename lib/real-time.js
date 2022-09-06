const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("meeting:newUserJoined", (newUser) => {
    const user = userJoin(newUser.username, newUser.room, socket.id);
    socket.broadcast.emit("meeting:userJoined", {
      user,
    });
    socket.join(user.room);
    socket.broadcast
      .to(user.room)
      .emit(
        "chat:message",
        formatMessage("admin", `${user.username} joined the chat!`)
      );
  });

  socket.on("meeting:newIceCandidate", (icecandidate) => {
    const user = getCurrentUser(socket.id);
    io.to(user[0].room).emit("meeting:iceCandidate", {
      icecandidate,
    });
  });

  socket.on("meeting:newMeetingOffer", (offer) => {
    const user = getCurrentUser(socket.id);
    io.to(user[0].room).emit("meeting:meetingOffer", {
      offer,
    });
  });

  socket.on("meeting:newMeetingAnswer", (answer) => {
    const user = getCurrentUser(socket.id);
    io.to(user[0].room).emit("meeting:meetingAnswer", {
      answer,
    });
  });

  socket.on("chat:chatMessage", (chatMessage) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit(
      "chat:message",
      formatMessage(user.username, chatMessage.message)
    );
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user[0].room).emit(
        "message",
        formatMessage("admin", `${user[0].username} left the chat!`)
      );
    }
  });
});

module.exports = io;
