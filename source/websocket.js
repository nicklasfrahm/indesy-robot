const socketio = require('socket.io-client')
const dotenv = require('dotenv').config()
const logger = require('./util').Logger()

const apiUrl = process.env.API_URL || 'http://localhost:8000'
const socket = socketio(apiUrl, { path: '/sio' })

socket.on('connect', () => {
  logger.info(`Connected: ${apiUrl}`)
  socket.emit('join', { room: 'robots' })
})

socket.on('disconnect', () => {
  logger.info(`Disconnected: ${apiUrl}`)
})

socket.on('controlMovement', data => {
  const DUTY_MAX = 255
  const DUTY_MIN = 0

  let body = {}

  if (data && data.buttons && data.duty !== undefined) {
    body.right = []
    body.left = []

    let forward = data.duty > 0

    duty = Math.abs(Math.floor(data.duty * DUTY_MAX / 100))

    if (~data.buttons.indexOf('L')) {
      body.right[forward ? 0 : 1] = 0
      body.right[forward ? 1 : 0] = duty
    } else {
      body.right[0] = DUTY_MIN
      body.right[1] = DUTY_MIN
    }

    if (~data.buttons.indexOf('R')) {
      body.left[forward ? 0 : 1] = 0
      body.left[forward ? 1 : 0] = duty
    } else {
      body.left[0] = DUTY_MIN
      body.left[1] = DUTY_MIN
    }
  }
  process.send({
    proxy: true,
    recipient: 'gpio',
    sender: process.env.workerName,
    cmd: 'pwmWrite',
    body
  })
})
