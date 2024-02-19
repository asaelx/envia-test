// Require dependencies and setup server
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
const axios = require("axios");
const PORT = process.env.PORT || 3000;

// Get env variables
require("dotenv").config();

// Setting up API variables
const apiUri = process.env.API_URI;
const createLabelUri = apiUri+"ship/generate/";
const queriesUri = process.env.QUERIES_URI;
const token = process.env.ACCESS_TOKEN;

// Setting up server
app.use(bodyParser.json());
app.use(express.static("public"));

// Initialize counter
let count = 0;

// Websockets
io.on("connect", (socket) => {

    console.log('Connected');

    // Get current guides with status "Created" and update counter
    (async () => {
        const createdGuidesLength = await createdGuidesCount();
        socket.emit("guidesupdate", createdGuidesLength);
        socket.broadcast.emit("guidesupdate", createdGuidesLength);
    })();

    // Listening to button event
    socket.on("createtestguide", async () => {
        await createTestGuide();
        const createdGuidesLength = await createdGuidesCount();
        socket.emit("guidesupdate", createdGuidesLength);
        socket.broadcast.emit("guidesupdate", createdGuidesLength);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected");
    });
});

const getCreatedGuidesConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${queriesUri}guide/02/2024?status_id=1`, // status_id = 1 is for status "Created"
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
};

// Get current count of guides with status "Created"
const createdGuidesCount = async () => {
    let response = await axios(getCreatedGuidesConfig);
    return await response.data.data.length;
};

// Get request from Envia Webhook
app.get("/hook", (req, res) => {
    console.log(req.body);
    res.status(200).end();
    // Update counter
    (async () => {
        const createdGuidesLength = await createdGuidesCount();
        socket.emit("guidesupdate", createdGuidesLength);
        socket.broadcast.emit("guidesupdate", createdGuidesLength);
    })();
});

// Create a new test guide configuration
const guideData = require("./guide_data.json");
const createTestGuideConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: createLabelUri,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    data: guideData
};

// API Call to create new test guide
const createTestGuide = async() => {
    await axios(createTestGuideConfig)
    .then(response => {
        console.log(response.data);
    })
    .catch(err => {
        console.error(err);
    });
};

// Server
server.listen(PORT, () => {
    console.log(`Listening on *:${PORT}`);
});
