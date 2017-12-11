const cluster = require('cluster')
const winston = require('winston').cli()

cluster.spawn = (script, name) => {
  winston.info(`[master] Spawning: ${name}`)
  cluster.fork({ workerScript: script, workerName: name }).env = {
    workerScript: script,
    workerName: name
  }
}

cluster.respawn = (worker, code, signal) => {
  winston.warn(`[master] Respawning: ${worker.env.workerName}`)
  cluster.fork(worker.env).env = worker.env
}

cluster.on('exit', cluster.respawn)

// websocket communication
cluster.spawn('./source/websocket', 'websocket')

// gpio communication
cluster.spawn('./source/gpio', 'gpio')

// proxy worker messages
cluster.on('message', (sender, message) => {
  if (message.proxy && message.recipient !== 'master') {
    message.proxy = false
    for (let workerId of Object.keys(cluster.workers)) {
      let worker = cluster.workers[workerId]
      if (worker.env.workerName === message.recipient) {
        worker.send(message)
        break
      }
    }
  }
})
