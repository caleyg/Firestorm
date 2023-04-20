const _ = require("lodash");
const {updateBrightness, getCurrentBrightness} = require("../db/controllers/brightness");
const {discoverPixelBlazes, sendCommand} = require("./pixelBlazeUtils");

let currentBrightness
let pixelBlazeData    = []
let pixelBlazeIds     = []
init = async () => {
    getCurrentBrightness()
        .then((brightness) => {
            currentBrightness = brightness[0].value
        })
    pixelBlazeData = discoverPixelBlazes()
    pixelBlazeIds = _.map(pixelBlazeData, 'id')
}

initInterval = setInterval(init, 100)

class Brightness {
    constructor(utils) {
        this.utils = utils ? utils : null
    }
    adjustBrightness = async (brightness) => {
        await new Promise((resolve) => {
            this.delayedSaveBrightness(resolve, brightness)
        })
    }
    delayedSaveBrightness = _.debounce(async (resolve, brightness) => {
        sendCommand(pixelBlazeIds, null, brightness)
        await this.storeBrightness(brightness);
        currentBrightness = brightness
        await this.utils.broadcastMessage({ currentBrightness: currentBrightness})
    }, 1000)
    getBrightness = async () =>{
        await this.utils.broadcastMessage({ currentBrightness: currentBrightness})
    }
    storeBrightness = async (brightness) => {
        const body = {
            value: brightness
        }
        await updateBrightness(body)
    }

}

module.exports.BrightnessWebsocket = function (utils) {
    const brightness = new Brightness(utils)
    this.utils = utils
    this.receiveMessage = async function (data) {
        let message
        try {
            message = JSON.parse(data);
        } catch (err) {
            this.utils.sendError(err)
            return
        }
        if (message.type === 'ADJUST_BRIGHTNESS') {
            console.log('received adjust brightness message!')
            await brightness.adjustBrightness(parseFloat(message.brightness))
        }
        if (message.type === 'GET_CURRENT_BRIGHTNESS') {
            console.log('received get current brightness message!')
            await brightness.getBrightness()
        }
    }
}
