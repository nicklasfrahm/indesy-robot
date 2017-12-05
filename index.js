const socketio = require('socket.io-client')
const winston = require('winston')
const dotenv = require('dotenv')
const { platform } = require('os')
const { runUpdate } = require('./source/commands')

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

socket.on('updateAvailable', () => {
  runUpdate()
})

// only execute on pi
if (platform() === 'linux') {
  const Gpio = require('pigpio').Gpio
  const MICROSECDONDS_PER_CM = 1e6 / 34321
  const echo = new Gpio(4, { mode: Gpio.INPUT, alert: true })
  const triggers = [
    new Gpio(25, { mode: Gpio.OUTPUT }),
    new Gpio(8, { mode: Gpio.OUTPUT }),
    new Gpio(17, { mode: Gpio.OUTPUT }),
    new Gpio(27, { mode: Gpio.OUTPUT }),
    new Gpio(22, { mode: Gpio.OUTPUT }),
    new Gpio(12, { mode: Gpio.OUTPUT })
  ]
  const STOP = 0
  const MAXDUTY = 255

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
        distances[counter] = (diff / 2 / MICROSECDONDS_PER_CM).toFixed(2)
      }
    })
  }

  interrupt()

  // trigger a distance measurement once per second
  setInterval(() => {
    ++counter
    if (counter > triggers.length - 1) counter = 0
    triggers[counter].trigger(10, 1) // set trigger high for 10 microseconds
  }, 100)

  // log results to console
  setInterval(() => {
    let string = ''
    distances.forEach(distance => (string = `${string}${distance} `))
    winston.info(`[USS] ${string}`)
  }, 1000)
  //define motor GPIO pins
  const motors = {
    left: {
      gpios: [
        new Gpio(14, { mode: Gpio.OUTPUT }),
        new Gpio(15, { mode: Gpio.OUTPUT })
      ],
      status: STOP
    },
    right: {
      gpios: [
        new Gpio(23, { mode: Gpio.OUTPUT }),
        new Gpio(24, { mode: Gpio.OUTPUT })
      ],
      status: STOP
    }
  }
  //control motors: 00 STOP, 01 CW, 10 CCW, 11 BRAKE
  socket.on('controlMovement', data => {
    console.log(data)
    if (data && data.buttons && data.duty !== undefined) {
      duty = Math.abs(Math.floor(data.duty * MAXDUTY / 100))
      let forward = data.duty > 0

      if (~data.buttons.indexOf('L')) {
        motors.right.gpios[forward ? 0 : 1].pwmWrite(0)
        motors.right.gpios[forward ? 1 : 0].pwmWrite(duty)
      } else {
        motors.right.gpios[0].pwmWrite(MAXDUTY)
        motors.right.gpios[1].pwmWrite(MAXDUTY)
      }
      if (~data.buttons.indexOf('R')) {
        motors.left.gpios[forward ? 0 : 1].pwmWrite(0)
        motors.left.gpios[forward ? 1 : 0].pwmWrite(duty)
      } else {
        motors.left.gpios[0].pwmWrite(MAXDUTY)
        motors.left.gpios[1].pwmWrite(MAXDUTY)
      }
    }
  })
}
