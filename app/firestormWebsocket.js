const WebSocketServer = require('ws').Server
const {PlaylistWebSocket} = require('./playlist')
const {Utils} = require('./utils')

// start playlist server
const address = '0.0.0.0';
const port = 1890;
const firestormServer = new WebSocketServer({host: address , port: port});
console.log(`Firestorm server is running on ${address}:${port}`);
firestormServer.on('connection', function (connection) {
    const utils = new Utils(connection)
    const playlistWebSocket = new PlaylistWebSocket(utils)
    if(utils.addFirestormClient(connection)) {
        return
    }
    connection.on('message', async function message(data, isBinary) {
        const message = isBinary ? data : data.toString();
        console.log(`incoming msg from: ${utils.getFirestormClientBySocket(connection)}, message: ${message}`)
        if (await playlistWebSocket.receiveMessage(message)) {
            return
        }
    })
    connection.on('close', function() {
        console.log('closed connection')
    })
})