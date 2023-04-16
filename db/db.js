const path = require('path')

const dbPath = path.resolve(__dirname, "./store/database.sqlite")

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: dbPath,
    },
    useNullAsDefault: true
})

knex.schema
    .hasTable('playlist')
    .then((exists) => {
        if (!exists) {
            return knex.schema.createTable('playlist', (table)  => {
                table.increments('id').primary()
                table.string('name')
                table.float('duration')
            })
                .then(() => {
                    console.log('Table \'playlist\' created')
                })
                .catch((error) => {
                    console.error(`There was an error creating the playlist table: ${error}`)
                })
        }
    })
    .then(() => {
        console.log('done')
    })
    .catch((error) => {
        console.error(`There was an error setting up the database: ${error}`)
    })

knex.select('*').from('playlist')
    .then(data => console.log('data:', data))
    .catch(err => console.log(err))

module.exports = knex