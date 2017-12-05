const cluster = require('cluster')
const os = require('os').platform()
const winston = require('winston').cli()

cluster.spawn = (script, name) => {
  winston.info(`[CMS] Spawning: ${name}`)
  cluster.fork({ workerScript: script, workerName: name }).env = {
    workerScript: script,
    workerName: name
  }
}

cluster.respawn = (worker, code, signal) => {
  winston.warn(`[CMS] Respawning: ${worker.env.workerName}`)
  cluster.fork(worker.env).env = worker.env
}

cluster.on('exit', cluster.respawn)

// test worker
cluster.spawn('./source/test', 'test')

// websocket communication
cluster.spawn('./source/websocket', 'websocket')

// ultrasonic sensor
if (os === 'linux') {
  cluster.spawn('./source/ultrasonic', 'ultrasonic')
}

cluster.on('message', (sender, message) => {
  if (message.proxy) {
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
