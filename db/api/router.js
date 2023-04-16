
const playlistDbRoutes = require('../controllers/playlist-controllers')

// Create router
module.exports = function (app) {
    app.get('/playlist/getPatterns', playlistDbRoutes.getAllPlaylistPatterns)
    app.post('/playlist/addPattern', playlistDbRoutes.addPatternToPlaylist)
    app.put('/playlist/removePattern', playlistDbRoutes.removePatternToPlaylist)
    app.put('/playlist/newPlaylist', playlistDbRoutes.newPlaylist)
}
