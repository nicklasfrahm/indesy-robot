const os = require('os').platform()
const { roundTo, Logger } = require('./util')

const DUTY_MIN = 0
const DUTY_MAX = 255
const logger = Logger()
const scanAmount = 100
const controlAmount = 100
const obstacleWaitTime = 1500
const scanPeriodTime = 1000 / scanAmount
const controlPeriodTime = 1000 / controlAmount
const µsPerCm = 1e6 / 34321
const minimumDistances = [25, 50, 40, 40, 50, 25]

let Gpio = null
let motors = null
let distances = [0, 0, 0, 0, 0, 0]
let echo = null
let triggers = null
let cursor = 0
let start = 0
let scanInterval = null
let controlInterval = null
let logInterval = null
let state = {
  obstacleRight: 0,
  obstacleLeft: 0,
  wifi: true
}

function setDuty(duty) {
  for (let motor of Object.keys(motors)) {
    for (let gpio of Object.keys(motors[motor])) {
      motors[motor][gpio].pwmWrite(duty)
    }
  }
}

function checkProximity(start) {
  for (let index = start; index < start + distances.length / 2; ++index) {
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
      new Gpio(23, { mode: Gpio.OUTPUT }),
      new Gpio(24, { mode: Gpio.OUTPUT })
    ],
    right: [
      new Gpio(14, { mode: Gpio.OUTPUT }),
      new Gpio(15, { mode: Gpio.OUTPUT })
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

    if (!checkProximity(0)) {
      if (!state.obstacleRight) {
        state.obstacleRight = Date.now()
      }
    } else {
      state.obstacleRight = 0
    }
    if (!checkProximity(3)) {
      if (!state.obstacleLeft) {
        state.obstacleLeft = Date.now()
      }
    } else {
      state.obstacleLeft = 0
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

    if (message.cmd === 'pwmWrite') {
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

controlInterval = setInterval(() => {
  if (!state.obstacleRight && !state.obstacleLeft) {
    // drive straight
    motors.left[0].pwmWrite(DUTY_MIN)
    motors.left[1].pwmWrite(DUTY_MAX)
    motors.right[0].pwmWrite(DUTY_MIN)
    motors.right[1].pwmWrite(DUTY_MAX)
  } else {
    if (state.obstacleRight) {
      // turn right
      motors.left[0].pwmWrite(DUTY_MIN)
      motors.left[1].pwmWrite(DUTY_MAX / 3 * 2)
      motors.right[0].pwmWrite(DUTY_MAX / 3 * 2)
      motors.right[1].pwmWrite(DUTY_MIN)
    } else {
      // turn left
      motors.left[0].pwmWrite(DUTY_MAX / 3 * 2)
      motors.left[1].pwmWrite(DUTY_MIN)
      motors.right[0].pwmWrite(DUTY_MIN)
      motors.right[1].pwmWrite(DUTY_MAX / 3 * 2)
    }
  }
}, controlPeriodTime)

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
