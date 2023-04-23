const knex = require('../db')
const _ = require("lodash");
const playlist_table = 'playlist'

exports.doesPatternExistInPlaylist = async (req) => {
    return await knex
        .select('*')
        .from(playlist_table)
        .where('name', "=", req.body.name)
        .then((res) => {
            if (res.length === 0) return false
            if (res.length !== 0) return true
        })
}
exports.getPlaylistFromDB = async () => {
    return await knex
        .select('*')
        .from(playlist_table)
        .then((data) => {
            return data
        })
        .catch(err => {
            console.log(`There was an error retrieving playlist items: ${err}`)
        })
}
exports.getAllPlaylistPatterns = async (req, res) => {
    this.getPlaylistFromDB().then(playlistData => {
        res.status(200)
            .json(playlistData);
    })
        .catch(err => {
            res.status(500)
                .json({message: `There was an error retrieving playlist items: ${err}`})
        })
}

exports.addPatternToPlaylist = async (req, res) => {
    const doesPatternExistInPlaylist = await this.doesPatternExistInPlaylist(req)
        .then((condition) => {
            return condition
        })
    // update existing pattern in playlist
    if(doesPatternExistInPlaylist) {
        await knex
            .update({
                duration: req.body.duration,
            })
            .into(playlist_table)
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
        await knex
            .insert({
                name: req.body.name,
                duration: req.body.duration,
            })
            .into(playlist_table)
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

exports.removePatternFromPlaylist = async (req, res) => {
    await knex
        .into(playlist_table)
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
    await knex.transaction(async trx => {
        //clear table first
        await knex
            .into(playlist_table)
            .where('id','!=', 'null')
            .del()
            .transacting(trx);
        // insert new pattern
        await knex
            .insert({
                name: req.body.name,
                duration: req.body.duration,
            })
            .into(playlist_table)
            .transacting(trx);
    })
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