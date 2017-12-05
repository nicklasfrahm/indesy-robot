const socketio = require('socket.io-client')
const winston = require('winston')
const dotenv = require('dotenv')

dotenv.config()
winston.cli()

const apiUrl = process.env.API_URL || 'http://localhost:8000'
const socket = socketio(apiUrl, { path: '/sio' })

socket.on('connect', () => {
  winston.info(`[SIO] Connected: ${apiUrl}`)
  socket.emit('join', { room: 'robots' })
})

socket.on('disconnect', () => {
  winston.info(`[SIO] Disconnected: ${apiUrl}`)
})

let trigger = 0

socket.on('testTimer', data => {
  ++trigger
  if (trigger > 4) {
    process.send({
      proxy: true,
      recipient: 'test',
      sender: process.env.workerName,
      body: data
    })
    trigger = 0
  }
})
