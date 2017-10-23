const io = require('socket.io-client')
const dotenv = require('dotenv').config()

const apiUrl = process.env.API_URL || 'http://localhost:8000'
const socket = io(apiUrl, { path: '/sio' })

socket.on('connect', () => {
  process.stdout.write(`[SIO] Connected to ${apiUrl}\n`)
})

socket.on('disconnect', () => {
  process.stdout.write(`[SIO] Disconnected to ${apiUrl}\n`)
})

socket.on('testTimer', data => {
  const time = new Date(data.timestamp).toLocaleTimeString()
  const offset = Date.now() - data.timestamp
  process.stdout.write(`[SIO] Test time is ${time} (${offset}ms offset)\n`)
})
