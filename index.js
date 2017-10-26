const socketio = require('socket.io-client')
const winston = require('winston')
const dotenv = require('dotenv')
const { pullRepo } = require('./source/commands')

dotenv.config()
winston.cli()

const apiUrl = process.env.API_URL || 'http://localhost:8000'
const socket = socketio(apiUrl, { path: '/sio' })

socket.on('connect', () => {
  winston.info(`[SIO] Connected to ${apiUrl}`)
  socket.emit('join', { room: 'robots' })
})

socket.on('disconnect', () => {
  winston.info(`[SIO] Disconnected to ${apiUrl}`)
})

socket.on('testTimer', data => {
  const time = new Date(data.timestamp).toLocaleTimeString()
  const offset = Date.now() - data.timestamp
  winston.info(`[SIO] Server time is ${time} (${offset}ms offset)`)
})

socket.on('update', () => {
  winston.info('[SIO] Performing update.')
  pullRepo()
})
