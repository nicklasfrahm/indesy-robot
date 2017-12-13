const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const sensor = require('./LSM6DS3')

const deviceAddress = 0x6a
let bus = null

function initializeSensor(cb) {
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
    bus.readWord(deviceAddress, sensor.OUT_TEMP_L, (err, temp) => {
      if (err) throw err
      process.stdout.write(`${temp}\n`)
    })
  })
})
