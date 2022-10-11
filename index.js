const config = require('./config');
require("dotenv").config();
const cors = require('cors')
const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const express = require('express');
const bodyParser = require('body-parser');
const { videoToken } = require('./tokens');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors()); // include before other routes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());


const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);


const findOrCreateRoom = async (roomName) => {
  try {
    // see if the room exists already. If it doesn't, this will throw
    // error 20404.
    await twilioClient.video.rooms(roomName).fetch();
  } catch (error) {
    // the room was not found, so create it
    if (error.code == 20404) {
      await twilioClient.video.rooms.create({
        uniqueName: roomName,
        type: "group",
        // audioOnly: true,
      });
    } else {
      // let other errors bubble up
      throw error;
    }
  }
};


const getAccessToken = (roomName) => {
  // create an access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    // generate a random unique identity for this participant
    { identity: uuidv4() }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};
app.get("/", (req, res) => {
  res.send("hello welcome to twilio server")
})
app.post("/join-room", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body || !req.body.roomName) {
    return res.status(400).send("Must include roomName argument.");
  }
  const roomName = req.body.roomName;

  // find or create a room with the given roomName
  findOrCreateRoom(roomName);

  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName);
  return res.send({
    token: token,
  });
});










app.listen(PORT, () =>
  console.log(`Express server is running on localhost:${PORT}`)
);
