const os = require('os').platform()
const { roundTo, Logger } = require('./util')
let Gpio = null

const logger = Logger()
const scanAmount = 50
const scanPeriodTime = 1000 / scanAmount
const µsPerCm = 1e6 / 34321
const minimumDistances = [15, 30, 30, 30, 30, 15]

let distances = [0, 0, 0, 0, 0, 0]
let echo = null
let triggers = null
let cursor = 0
let start = 0
let scanInterval = null
let logInterval = null

function checkProximity() {
  for (let index = 0; index < distances.length; ++index) {
    if (distances[index] < minimumDistances[index]) {
      return false
    }
  }
  return true
}

if (os === 'linux') {
  const Gpio = require('pigpio')

  echo = new Gpio(4, { mode: Gpio.INPUT, alert: true })
  triggers = [
    new Gpio(25, { mode: Gpio.OUTPUT }),
    new Gpio(8, { mode: Gpio.OUTPUT }),
    new Gpio(17, { mode: Gpio.OUTPUT }),
    new Gpio(27, { mode: Gpio.OUTPUT }),
    new Gpio(22, { mode: Gpio.OUTPUT }),
    new Gpio(12, { mode: Gpio.OUTPUT })
  ]

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

    let body = {}

    if (!checkProximity()) {
      body.enabled = false
    } else {
      body.enabled = true
    }

    process.send({
      proxy: true,
      recipient: 'motor',
      sender: process.env.workerName,
      cmd: 'setConfig',
      body
    })
  }, scanPeriodTime)
}

// log results to console
logInterval = setInterval(() => {
  const reducer = (accumulator, current) => `${accumulator}${current} `
  logger.info(`${distances.reduce(reducer, '')}`)
}, 1000)
