const os = require('os').platform()

let Gpio = null
let logger = null
let motors = null
let config = { enabled: true }

if (os === 'linux') {
  Gpio = require('pigpio').Gpio

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
} else {
  logger = require('./util').Logger()
}

process.on('message', message => {
  if (message && message.body) {
    const { body } = message

    if (message.cmd === 'writePwm' && config.enabled) {
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
    if (message.cmd === 'setConfig') {
      config.enabled = body.enabled || config.enabled
    }
  }
})

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
    for (let motor of Object.keys(motors)) {
      for (let gpio of Object.keys(motors[motor])) {
        motors[motor][gpio].pwmWrite(0)
      }
    }
  } else {
    logger.info(`Pulling down PWM ...`)
  }
  process.exit()
})
