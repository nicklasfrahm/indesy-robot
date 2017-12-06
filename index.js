const cluster = require('cluster')
const winston = require('winston').cli()

if (cluster.isMaster) {
  require('./source/master')
} else {
  try {
    require(process.env.workerScript)
  } catch (err) {
    winston.error(`[master] Missing script: ${process.env.workerName}`)
  }
}
