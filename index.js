const io = require('socket.io-client')
const winston = require('winston')
const dotenv = require('dotenv')

dotenv.config()
winston.cli()

const apiUrl = process.env.API_URL || 'http://localhost:8000'
const socket = io(apiUrl, { path: '/sio' })

socket.on('connect', () => {
  winston.info(`[SIO] Connected to ${apiUrl}`)
})

socket.on('disconnect', () => {
  winston.info(`[SIO] Disconnected to ${apiUrl}`)
})

socket.on('testTimer', data => {
  const time = new Date(data.timestamp).toLocaleTimeString()
  const offset = Date.now() - data.timestamp
  winston.info(`[SIO] Server time is ${time} (${offset}ms offset)`)
})
