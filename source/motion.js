const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const readline = require('readline')
const sensor = require('./LSM6DS3')

const deviceAddress = 0x6a
let bus = null
let logInterval = null
let word = 0
let byte = 0

function continousLog(message) {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(message)
}

function initializeSensor(cb) {
  readWordLogLoop = register => {
    bus.readWord(deviceAddress, register, (err, data) => {
      if (err) throw err
      word = data
      readWordLogLoop(register)
    })
  }

  readBytesLogLoop = register => {
    bus.readByte(deviceAddress, register, (err, low) => {
      if (err) throw err
      bus.readByte(deviceAddress, register + 1, (err, high) => {
        if (err) throw err
        byte = (high << 8) | (low << 0)
        readBytesLogLoop(register)
      })
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

    readWordLogLoop(sensor.OUTX_L_XL)
    readBytesLogLoop(sensor.OUTX_L_XL)

    logInterval = setInterval(() => {
      continousLog(`W: ${word} | B: ${byte}`)
    }, 200)
  })
})
