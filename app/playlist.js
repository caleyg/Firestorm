const _ = require("lodash");
const {discoveries} = require("./discovery");
const {getPlaylistFromDB, addPatternToPlaylist, removeAllPatterns} = require("../db/controllers/playlist");

let currentPlaylistData  = []
let currentPlaylist      = []
let initInterval
let pixelBlazeData       = []
let pixelBlazeIds        = []
init = async () => {
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
    pixelBlazeData = discoverPixelBlazes()
    pixelBlazeIds = _.map(pixelBlazeData, 'id')
}
discoverPixelBlazes = () => {
    return _.map(discoveries, function (v, k) {
        let res = _.pick(v, ['lastSeen', 'address']);
        _.assign(res, v.controller.props);
        return res;
    })
}
initInterval = setInterval(init, 100)

class Playlist {
    constructor(utils) {
        this.playlistLoopInterval = null
        this.playlistLoopTimeout  = null
        this.playlistTimeout      = null
        this.utils                = utils ? utils : null
    }

    playlistLoop = async () => {
        while(true) {
            await new Promise(resolve => {
                this.playlistLoopTimeout = setTimeout(resolve, 100)
            });
            console.log(pixelBlazeIds.length)
            console.log({currentPlaylist})
            if(pixelBlazeIds.length) {
                await this.iterateOnPlaylist()
            }
            this.initInterval = null
            this.playlistTimeout = null
            this.playlistLoopTimeout = null
            this.playlistLoopInterval = null
        }
    }
    iterateOnPlaylist = async () => {
        for (let index = 0; index < currentPlaylist.length; index++) {
            const pattern = currentPlaylist[index]
            await this.delaySendPattern(pattern)
            await new Promise(resolve => {
                console.log(`in iterate playlist waiting for ${pattern.duration * 1000}`)
                this.playlistTimeout = setTimeout(resolve, pattern.duration * 1000)
            });
        }
    }
    delaySendPattern = async (pattern) => {
        await new Promise((resolve) => {
            resolve(
                this.sendPattern(pattern)
            )
        })
    }
    disableAllPatterns = async () => {
        await removeAllPatterns()
        await this.runPlaylistLoopNow()
    }
    enableAllPatterns = async (duration) => {
        const pixelBlazePatterns = this.gatherPatternData(pixelBlazeData)
        _.each(pixelBlazePatterns, pattern => {
            pattern['duration']=duration
            let body = {
                name: pattern.name,
                duration: pattern.duration
            }
            addPatternToPlaylist(body)
        })
        await this.runPlaylistLoopNow()
    }
    gatherPatternData = (pixelBlazeData) => {
        let groupByPatternName = {};
        _.each(pixelBlazeData, d => {
            d.name = d.name || "Pixelblaze_" + d.id // set name if missing
            _.each(d.programList, p => {
                let pb = {
                    id: d.id,
                    name: d.name
                };
                if (groupByPatternName[p.name]) {
                    groupByPatternName[p.name].push(pb);
                } else {
                    groupByPatternName[p.name] = [pb];
                }
            })
        })
        let groups = _.chain(groupByPatternName)
            .map((v, k) => ({name: k}))
            .sortBy('name')
            .value();
        return groups
    }
    runPlaylistLoopNow = async () => {
        clearInterval(this.initInterval)
        clearInterval(this.playlistTimeout)
        clearInterval(this.playlistLoopInterval)

        await this.playlistLoop()
    }
    sendPattern = (pattern) => {
        console.log('sending message')
        const name = pattern.name
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
        // skipping this if utils is not initialized due to no websocket connections
        if(this.utils) {
            let message = {
                currentRunningPattern: name,
                currentPlaylist: currentPlaylist
            }
            console.log(message)
            this.utils.broadcastMessage(message)
        }
    }

}
// Initializing the playlist loop outside the websocket
// because we might not always have a browser open when
// starting/restarting the node-server... it should send
// commands and operate on the playlist w/o the need of an
// active websocket connection
initThe = new Playlist()
initThe.playlistLoop()
    .then(() =>  {})


module.exports.PlaylistWebSocket = function (utils) {
    const playlist = new Playlist(utils)
    this.utils = utils
    this.receiveMessage = async function (data) {
        let message
        try {
            message = JSON.parse(data);
        } catch (err) {
            this.utils.sendError(err)
            return
        }
        if (message.type === 'LAUNCH_PLAYLIST_NOW') {
            console.log('received launch playlist now message!')
            await playlist.runPlaylistLoopNow()
        }
        if (message.type === 'ENABLE_ALL_PATTERNS') {
            console.log('received message to enable all patterns!')
            await playlist.enableAllPatterns(message.duration)
        }
        if (message.type === 'DISABLE_ALL_PATTERNS') {
            console.log('received message to disable all patterns!')
            await playlist.disableAllPatterns(message.duration)
        }
    }
}
