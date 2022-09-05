const path = require("path");
const express = require("express");
const router = express.Router();

router.route(/^\/$|^\/lobby$/).get((req, res) => {
  res.sendFile(path.resolve(__dirname + "/../public/lobby.html"));
});

router.route("/meeting-room").get((req, res) => {
  res.sendFile(path.resolve(__dirname + "/../public/meeting.html"));
});

router.route("*").get((req, res) => {
  res.sendStatus(404);
});

module.exports = router;
