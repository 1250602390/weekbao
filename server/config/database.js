const { Sequelize } = require('sequelize')
const config = require('./index')

const sequelize = new Sequelize({
  dialect: config.database.dialect,
  storage: config.database.dialect === 'sqlite' ? config.database.storage : undefined,
  host: config.database.dialect !== 'sqlite' ? config.database.host : undefined,
  port: config.database.dialect !== 'sqlite' ? config.database.port : undefined,
  database: config.database.dialect !== 'sqlite' ? config.database.name : undefined,
  username: config.database.dialect !== 'sqlite' ? config.database.user : undefined,
  password: config.database.dialect !== 'sqlite' ? config.database.password : undefined,
  logging: config.database.dialect === 'sqlite' ? false : console.log,
  define: {
    underscored: true,
    timestamps: true,
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
})

module.exports = sequelize
