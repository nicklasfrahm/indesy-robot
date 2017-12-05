const { Gpio } = require('pigpio')
const winston = require('winston').cli()
const dotenv = require('dotenv').config()
const { roundTo } = require('./util')

const µsPerCm = 1e6 / 34321
const echo = new Gpio(4, { mode: Gpio.INPUT, alert: true })
const triggers = [
  new Gpio(25, { mode: Gpio.OUTPUT }),
  new Gpio(8, { mode: Gpio.OUTPUT }),
  new Gpio(17, { mode: Gpio.OUTPUT }),
  new Gpio(27, { mode: Gpio.OUTPUT }),
  new Gpio(22, { mode: Gpio.OUTPUT }),
  new Gpio(12, { mode: Gpio.OUTPUT })
]

let distances = [0, 0, 0, 0, 0, 0]
let cursor = 0
let start = 0
let scanner = null
let logger = null

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

scanner = setInterval(() => {
  ++cursor
  if (cursor > triggers.length - 1) {
    cursor = 0
  }

  // set trigger high for 10 microseconds
  triggers[cursor].trigger(10, 1)
}, scanInterval)

// log results to console
logger = setInterval(() => {
  const reducer = (accumulator, current) => `${accumulator}${current} `
  winston.info(`[USS] ${distances.reduce(reducer, '')}`)
}, 1000)
