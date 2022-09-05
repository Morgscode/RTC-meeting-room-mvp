const { v4: uuidv4 } = require("uuid");

const users = [];

function userJoin(username, room, socketID) {
  const id = uuidv4();
  const user = { id, username, room, socketID };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find((user) => user.socketID === id);
}

function userLeave(socketID) {
  const index = users.findIndex((user) => user.socketID === socketID);
  if (index !== -1) {
    return users.splice(index, 1);
  }
}

function getUsersByRoom(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getUsersByRoom,
};
