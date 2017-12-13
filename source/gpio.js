const os = require('os').platform()
const { roundTo, Logger } = require('./util')

const DUTY_MIN = 0
const DUTY_MAX = 255
const logger = Logger()
const scanAmount = 50
const obstacleWaitTime = 3000
const scanPeriodTime = 1000 / scanAmount
const µsPerCm = 1e6 / 34321
const minimumDistances = [15, 30, 30, 30, 30, 15]

let Gpio = null
let motors = null
let distances = [0, 0, 0, 0, 0, 0]
let echo = null
let triggers = null
let cursor = 0
let start = 0
let scanInterval = null
let logInterval = null
let state = {
  obstacle: 0,
  wifi: true
}

function setDuty(duty) {
  for (let motor of Object.keys(motors)) {
    for (let gpio of Object.keys(motors[motor])) {
      motors[motor][gpio].pwmWrite(duty)
    }
  }
}

function checkProximity() {
  for (let index = 0; index < distances.length; ++index) {
    if (distances[index] < minimumDistances[index]) {
      return false
    }
  }
  return true
}

if (os === 'linux') {
  const Gpio = require('pigpio').Gpio

  echo = new Gpio(21, { mode: Gpio.INPUT, alert: true })

  triggers = [
    new Gpio(11, { mode: Gpio.OUTPUT }),
    new Gpio(5, { mode: Gpio.OUTPUT }),
    new Gpio(6, { mode: Gpio.OUTPUT }),
    new Gpio(13, { mode: Gpio.OUTPUT }),
    new Gpio(19, { mode: Gpio.OUTPUT }),
    new Gpio(26, { mode: Gpio.OUTPUT })
  ]

  motors = {
    left: [
      new Gpio(14, { mode: Gpio.OUTPUT }),
      new Gpio(15, { mode: Gpio.OUTPUT })
    ],
    right: [
      new Gpio(23, { mode: Gpio.OUTPUT }),
      new Gpio(24, { mode: Gpio.OUTPUT })
    ]
  }

  // pull down triggers
  triggers.forEach(trigger => {
    trigger.digitalWrite(0)
  })

  // pin change interrupt
  echo.on('alert', function(level, tick) {
    let stop
    let delta

    if (level == 1) {
      start = tick
    } else {
      stop = tick
      // use unsigned 32 bit arithmetic
      delta = (stop >> 0) - (start >> 0)
      distances[cursor] = roundTo(delta / 2 / µsPerCm, 2)
    }
  })

  scanInterval = setInterval(() => {
    ++cursor
    if (cursor > triggers.length - 1) {
      cursor = 0
    }

    // set trigger high for 10 microseconds
    triggers[cursor].trigger(10, 1)

    if (!checkProximity()) {
      if (!state.obstacle) {
        state.obstacle = Date.now()
      }
      if (Date.now() <= state.obstacle + obstacleWaitTime) {
        setDuty(DUTY_MAX)
        process.stdout.write('BRAKE\n')
      }
    } else {
      state.obstacle = 0
    }
  }, scanPeriodTime)
}

// log distances
logInterval = setInterval(() => {
  const reducer = (accumulator, current) => `${accumulator}${current} `
  logger.info(`${distances.reduce(reducer, '')}`)
}, 1000)

// drive motor
process.on('message', message => {
  if (message && message.body) {
    const { body } = message
    const unobstructed =
      !state.obstacle || Date.now() > state.obstacle + obstacleWaitTime

    if (message.cmd === 'pwmWrite' && unobstructed) {
      process.stdout.write('DRIVE\n')
      for (let motor of Object.keys(body)) {
        if (body[motor]) {
          for (let gpio of Object.keys(body[motor])) {
            if (os === 'linux') {
              motors[motor][gpio].pwmWrite(body[motor][gpio])
            } else {
              logger.info(`PWM: ${motor} ${gpio} ${body[motor][gpio]}`)
            }
          }
        }
      }
    }
  }
})

// turn off pwm on shutdown
if (os === 'win32') {
  const rl = require('readline')
    .createInterface({
      input: process.stdin,
      output: process.stdout
    })
    .on('SIGINT', () => {
      process.emit('SIGINT')
    })
}

process.on('SIGINT', () => {
  if (os === 'linux') {
    setDuty(DUTY_MIN)
  } else {
    logger.info(`Pulling down PWM ...`)
  }
  process.exit()
})
