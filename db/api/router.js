const brightnessDbRoutes = require('../controllers/brightness')
const playlistDbRoutes = require('../controllers/playlist')

// Create router
module.exports = function (app) {
    app.get('/playlist/getPatterns', playlistDbRoutes.getAllPlaylistPatterns)
    app.post('/playlist/addPattern', playlistDbRoutes.addPatternToPlaylist)
    app.put('/playlist/removePattern', playlistDbRoutes.removePatternFromPlaylist)
    app.put('/playlist/newPlaylist', playlistDbRoutes.newPlaylist)
    app.put('/playlist/newPlaylist', playlistDbRoutes.newPlaylist)
    app.get('/brightness/current', brightnessDbRoutes.currentBrightness)
    app.post('/brightness/update', brightnessDbRoutes.updateBrightness)
}
