const knex = require('../db')
const _ = require("lodash");
const brightness_table = 'brightness'
exports.doesBrightnessExistInTable = async (req) => {
    return await knex
        .select('*')
        .from(brightness_table)
        .where('id', "!=", null)
        .then((res) => {
            if (res.length === 0) return false
            if (res.length !== 0) return true
        })
}

exports.currentBrightness = async (req, res) => {
    return await knex
        .select('*')
        .from(brightness_table)
        .then((data) => {
            res.status(200)
                .json(data);
        })
        .catch(err => {
            console.log(`There was an error retrieving brightness: ${err}`)
        })
}

exports.updateBrightness = async (req, res) => {
    await knex.transaction(async trx => {
        //clear table first
        await knex
            .into(brightness_table)
            .where('id','!=', 'null')
            .del()
            .transacting(trx);
        // insert new pattern
        await knex
            .insert({
                value: req.body.value,
            })
            .into(brightness_table)
            .transacting(trx);
    })
        .then( () => {
                res.status(200)
                    .json({ message: `Creating a new brightness with level '${req.body.value}'.`});
            }
        )
        .catch(err => {
            res.status(500)
                .json({
                    message: `There was an error creating a new brightness with level '${req.body.value}', error: ${err}`
                })
        })
}