const cluster = require('cluster')

if (cluster.isMaster) {
  require('./source/master')
} else {
  require(process.env.workerScript)
}
