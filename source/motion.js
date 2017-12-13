const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const sensor = require('./LSM6DS3')

const deviceAddress = 0x6a
let readWord = null
let bus = null

function initializeSensor(cb) {
  readWordLogLoop = (register, message) => {
    bus.readWord(deviceAddress, register, (err, word) => {
      if (err) throw err
      process.stdout.write(`${message}${word}\n`)
      readWordLogLoop(register)
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

    // read temperature as test
    readWordLogLoop(sensor.OUTX_L_XL, 'X: ')
    readWordLogLoop(sensor.OUTY_L_XL, 'Y: ')
    readWordLogLoop(sensor.OUTZ_L_XL, 'Z: ')
  })
})
