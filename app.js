const PORT = process.env.PORT || 4001;
const express = require("express");
const cors = require('cors')
const http = require("http");
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid4 = require('uuid4');
const app = express();
const server = http.createServer(app);

app.use(cors())
// app.use('/', index);

var app_access_key = '632b42cce08863a3f2f6cd87';
var app_secret = '5TiFGWliqoTbdkTDXc-lZ0CxoLSeZupVvkN7KAjGE2dtW13U-zFF0jcuaickOPy2QmKjCC-vNBPM3OFT-8Ab7HzVHJQc_ps1JvqdUjk26Jaulla0dd-luzCMIDRojD8sqduIlG6VJvrE25DTPuTf-jtre2L0Yov0y72KnRIC-RA=';

app.get('/', (req, res) => { return res.send("welcome to server") })
app.get('/managementToken', (req, res) => {
    console.log("req1");
    jwt.sign(
        {
            access_key: app_access_key,
            type: 'management',
            version: 2,
            iat: Math.floor(Date.now() / 1000),
            nbf: Math.floor(Date.now() / 1000)
        },
        app_secret,
        {
            algorithm: 'HS256',
            expiresIn: '24h',
            jwtid: uuid4()
        },
        function (err, token) {
            console.log(token);
            if (err) { return res.send(" managment token generation fail") }


            axios.post('https://api.100ms.live/v2/rooms',

                {
                    "name": `new-room-${Date.parse(new Date())}`,
                    "description": "This is a sample description for the room",
                    "template_id": "632b5121332d6e4c5e797e61",
                    "recording_info": { "enabled": false },
                    "region": "in"
                },
                {
                    headers: {
                        'Content-type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }

            ).then(async (result) => {

                console.log('result', result);



                axios.post(`https://prod-in2.100ms.live/hmsapi/unifymarketplace-audio.app.100ms.live/api/token`, {

                    user_id: result.data.customer_id, // User ID assigned by you (different from 100ms' assigned id)
                    role: 'speaker', // listener , speaker , moderator
                    room_id: result.data.id,

                }).then((resposeData) => {
                    console.log("resposeData", resposeData.data.token);

                    return res.send({ 'token': resposeData.data.token, 'roomId': result.data.id })

                }).catch((err) => {
                    console.log(err);
                })



            });
        });

})

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));