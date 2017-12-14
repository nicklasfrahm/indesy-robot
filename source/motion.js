const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const readline = require('readline')
const sensor = require('./LSM6DS3')

const deviceAddress = 0x6a
let bus = null
let logInterval = null
let acceleration = {
  x: 0,
  y: 0,
  z: 0
}

function continousLog(message) {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(message)
}

function initializeSensor(cb) {
  readWordLoop = (register, variable) => {
    bus.readWord(deviceAddress, register, (err, word) => {
      if (err) throw err
      variable = word > 1 << 15 ? word - (2 << 16) : word
      readWordLoop(register, variable)
    })
  }

  bus.writeByte(deviceAddress, sensor.CTRL9_XL, 0x38, err => {
    if (err) return cb(err)
    bus.writeByte(deviceAddress, sensor.CTRL1_XL, 0x60, err => {
      if (err) return cb(err)
      bus.writeByte(deviceAddress, sensor.CTRL10_C, 0x38, err => {
        if (err) return cb(err)
        bus.writeByte(deviceAddress, sensor.CTRL2_G, 0x60, err => {
          if (err) return cb(err)
          cb()
        })
      })
    })
  })
}

bus = i2c.open(1, function(err) {
  if (err) throw err
  initializeSensor(err => {
    if (err) throw err

    readWordLoop(sensor.OUTX_L_XL, acceleration.x)
    readWordLoop(sensor.OUTY_L_XL, acceleration.y)
    readWordLoop(sensor.OUTZ_L_XL, acceleration.z)

    logInterval = setInterval(() => {
      continousLog(`${acceleration.x} | ${acceleration.y} | ${acceleration.z}`)
    }, 500)
  })
})
