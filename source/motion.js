const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const sensor = require('./LSM6DS3')

const deviceAddress = 0x6a
let readWord = null
let writeByte = null
let bus = null

function initializeSensor(cb) {
  readWord = bus.readWord.bind(null, deviceAddress)
  readByte = bus.readByte.bind(null, deviceAddress)
  writeByte = bus.writeByte.bind(null, deviceAddress)

  writeByte(sensor.CTRL9_XL, 0x38, err => {
    if (err) return cb(err)
    writeByte(sensor.CTRL1_XL, 0x60, err => {
      if (err) return cb(err)
      writeByte(sensor.CTRL10_C, 0x38, err => {
        if (err) return cb(err)
        writeByte(sensor.CTRL2_G, 0x60, err => {
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
    readWord(sensor.OUT_TEMP_L, (err, temp) => {
      if (err) throw err
      process.stdout.write(`${temp}\n`)
    })
  })
})
