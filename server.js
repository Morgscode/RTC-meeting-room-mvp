const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const router = require("./lib/router");

const formatMessage = require("./utils/messages");
const {
  userJoin,
  userLeave,
  getCurrentUser,
  getUsersByRoom,
} = require("./utils/users");

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(router);

app.all("*", (req, res, next) => {
  res.send({ message: "not found" });
  next(new AppError(`cannot find ${req.originalUrl}`));
});

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
    socket.broadcast.emit("meeting:iceCandidate", {
      icecandidate,
    });
  });

  socket.on("meeting:newMeetingOffer", (offer) => {
    socket.broadcast.emit("meeting:meetingOffer", {
      offer,
    });
  });

  socket.on("meeting:newMeetingAnswer", (answer) => {
    socket.broadcast.emit("meeting:meetingAnswer", {
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

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.info(`Running on port ${PORT}`));
