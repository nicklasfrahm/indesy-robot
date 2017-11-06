const socketio = require('socket.io-client')
const winston = require('winston')
const dotenv = require('dotenv')
const { runUpdate } = require('./source/commands')
const { platform } = require('os')

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
  // winston.info(`[SIO] Server time is ${time} (${offset}ms offset)`)
})

socket.on('updateAvailable', () => {
  runUpdate()
})

// only execute on pi
if (platform() === 'linux') {
  const Gpio = require('pigpio').Gpio
  const MICROSECDONDS_PER_CM = 1e6 / 34321
  const echo = new Gpio(17, { mode: Gpio.INPUT, alert: true })
  const triggers = [
    new Gpio(2, { mode: Gpio.OUTPUT }),
    new Gpio(3, { mode: Gpio.OUTPUT }),
    new Gpio(4, { mode: Gpio.OUTPUT }),
    new Gpio(14, { mode: Gpio.OUTPUT }),
    new Gpio(15, { mode: Gpio.OUTPUT }),
    new Gpio(18, { mode: Gpio.OUTPUT })
  ]

  let distances = triggers.map(e => 0)
  let counter = 0

  // pull down triggers
  triggers.forEach(trigger => trigger.digitalWrite(0))

  // create interrupt listener
  function interrupt() {
    let startTick

    echo.on('alert', function(level, tick) {
      let endTick, diff

      if (level == 1) {
        startTick = tick
      } else {
        endTick = tick
        diff = (endTick >> 0) - (startTick >> 0) // unsigned 32 bit arithmetic
        distances[counter] = diff / 2 / MICROSECDONDS_PER_CM
      }
    })
  }

  interrupt()

  // trigger a distance measurement once per second
  setInterval(() => {
    ++counter
    if (counter > triggers.length - 1) counter = 0
    triggers[counter].trigger(10, 1) // set trigger high for 10 microseconds
  }, 250)

  // log results to console
  setInterval(() => {
    let string = ''
    distances.forEach(distance => (string = `${string}${distance} `))
    winston.info(`[USS] ${string}`)
  }, 1000)
}
