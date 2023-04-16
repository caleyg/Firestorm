const knex = require('../db')

exports.getAllPlaylistPatterns = async (req, res) => {
    knex
        .select('*')
        .from('playlist')
        .then(playlistData => {
            res.status(200)
                .json(playlistData);
        })
        .catch(err => {
            res.status(500)
                .json({message: `There was an error retrieving playlist items: ${err}`})
        })
}

exports.addPatternToPlaylist = async (req, res) => {
    const doesPatternExistInPlaylist = await knex
        .select('*')
        .from('playlist')
        .where('name', "=", req.body.name)
        .then((res) => {
            if(res.length === 0) return false
            if(res.length !== 0) return true
        })
    // update existing pattern in playlist
    if(doesPatternExistInPlaylist) {
        knex
            .update({
                duration: req.body.duration,
            })
            .into('playlist')
            .where(
                'name', '=', req.body.name
            )
            .then(() => {
                res.status(200).json({message: `Pattern \'${req.body.name}\' with a duration of ${req.body.duration} created.`})
            })
            .catch(err => {
                res.status(500).json({message: `There was an error adding the ${req.body.name} pattern: ${err}`})
            })
    }
    // insert new pattern into playlist
    if(!doesPatternExistInPlaylist) {
        knex
            .insert({
                name: req.body.name,
                duration: req.body.duration,
            })
            .into('playlist')
            .then(() => {
                res.status(200)
                    .json({message: `Pattern \'${req.body.name}\' with a duration of ${req.body.duration} created.`})
            })
            .catch(err => {
                res.status(500)
                    .json({message: `There was an error adding the ${req.body.name} pattern: ${err}`})
            })
    }
}

exports.removePatternToPlaylist = async (req, res) => {
    knex
        .into('playlist')
        .where('name', req.body.name)
        .del()
        .then( () => {
            res.status(200)
                .json({ message: `Removed pattern '${req.body.name}' from playlist.`});
            }
        )
        .catch(err => {
            res.status(500)
                .json({
                    message: `There was an error removing the pattern '${req.body.name}', error: ${err}`
                })
        })
}

exports.newPlaylist = async (req, res) => {
    await knex
        .into('playlist')
        .where('id','!=', 'null')
        .del()
        .then( () => {
                res.status(200)
                    .json({ message: `Creating a new playlist with pattern '${req.body.name}' from playlist.`});
            }
        )
        .catch(err => {
            res.status(500)
                .json({
                    message: `There was an error creating a new playlist with pattern '${req.body.name}', error: ${err}`
                })
        })
}