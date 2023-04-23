const _ = require("lodash");
const {discoveries} = require("./discovery");
const {getPlaylistFromDB} = require("../db/controllers/playlist");

const WebSocket = require('ws');
const http = require('http');
const {
    v4: uuidv4,
} = require('uuid');

const playlist = {};
exports.playlist = playlist;

let currentPlaylist = []
let currentPlaylistData = []
let pixelBlazeData = []
let pixelBlazeIds = []
let playlistTimeout = null
let playlistLoopTimeout = null
let initInterval = null
init = () => {
    getPlaylistFromDB()
        .then((data) => {
            try {
                currentPlaylist = [] // resetting current play so it doesn't grow to infinity
                currentPlaylist.push(...data) // adding new playlist items to list
                if (JSON.stringify(currentPlaylist) !== JSON.stringify(currentPlaylistData)) {
                    currentPlaylistData = []
                    currentPlaylistData.push(...data)
                }
            } catch (err) {
                console.warn(`Error: ${err}`)
            }
        })
        .catch('there was an error gathering playlist details')

    // gather pixelblaze data
    pixelBlazeData = _.map(discoveries, function (v, k) {
        let res = _.pick(v, ['lastSeen', 'address']);
        _.assign(res, v.controller.props);
        return res;
    })
    pixelBlazeIds = _.map(pixelBlazeData, 'id')
}

initInterval = setInterval(init ,100)

const server = http.createServer();
const address = '0.0.0.0'
const port = 1890;
const playlistServer = new WebSocket.Server({host: address , port: port});
console.log(`Playlist server is running on ${address}:${port}`)

const playlistClients = {};

playlistServer.on('connection', (connection) => {
    // Generate a unique code for every user
    const clientId = uuidv4()
    console.log(`Recieved a new connection.`);

    // Store the new connection and handle messages
    playlistClients[clientId] = connection;
    console.log(`${clientId} connected.`);
    connection.on('message', async (data) => {
        let message
        try {
            message = JSON.parse(data);
        } catch (err) {
            sendError(playlistServer, `Wrong format ${err}`)
            return
        }
        if (message.type === 'LAUNCH_PLAYLIST_NOW') {
            console.log('received launch playlist now message!')
            await runPlaylistLoopNow()
        }
    })
});

const sendError = (ws, message) => {
    const messageObject = {
        type: 'ERROR',
        payload: message,
    };
    ws.send(JSON.stringify(messageObject));
};
const broadcastMessage = (json) => {
    const data = JSON.stringify(json);
    for(let userId in playlistClients) {
        let playlistClient = playlistClients[userId];
        if(playlistClient.readyState === WebSocket.OPEN) {
            playlistClient.send(data);
        }
    };
};
const sendPattern = (pattern) => {
    const  name = pattern.name
    _.each(pixelBlazeIds, async id => {
        id = String(id);
        let controller = discoveries[id] && discoveries[id].controller;
        if (controller) {
            const command = {
                programName: pattern.name
            }
            await controller.setCommand(command);
        }
    })
    let message = {
        currentRunningPattern: name,
        currentPlaylist: currentPlaylist
    }
    broadcastMessage(message)
}

const delaySendPattern = (pattern) => {
    return new Promise((resolve) => {
        resolve(sendPattern(pattern))
    })
}
const iterateOnPlaylist =  async () => {
    for (let index = 0; index < currentPlaylist.length; index++) {
        const pattern = currentPlaylist[index]
        await delaySendPattern(pattern)
        await new Promise(resolve => {
            playlistTimeout = setTimeout(resolve, pattern.duration * 1000)
        });
    }
}
module.exports.playlistLoop = async () => {
    while (true) {
        await new Promise(resolve => {
            playlistLoopTimeout = setTimeout(resolve, 100)
        });
        if(pixelBlazeIds.length) {
            await iterateOnPlaylist()
        }
        initInterval = null
        playlistTimeout = null
        playlistLoopTimeout = null
    }
}
const runPlaylistLoopNow = async () => {
    clearInterval(initInterval)
    clearInterval(playlistTimeout)
    clearInterval(playlistLoopTimeout)

    await this.playlistLoop()
}
this.playlistLoop()
