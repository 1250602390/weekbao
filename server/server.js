const app = require('./app')
const config = require('./config')
const { initDatabase } = require('./models')
const { startCronJobs } = require('./services/cronService')

async function start() {
  try {
    await initDatabase()
    startCronJobs()
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`)
      console.log(`Storage: JSON file (data/db.json)`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
