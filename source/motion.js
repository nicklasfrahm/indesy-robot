const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const readline = require('readline')
const sensor = require('./LSM6DS3')

const G = 9.81
const deviceAddress = 0x6a
let bus = null
let logInterval = null
let output = {}

function continousLog(message) {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(message)
}

function pad(string, width) {
  string = string.toString()
  return width <= string.length ? string : pad(width, ` ${string}`)
}

function toMetersPerSecond(raw) {
  return raw / (1 << 15) * 2 * G
}

function initializeSensor(cb) {
  readWordLoop = (register, name) => {
    bus.readWord(deviceAddress, register, (err, word) => {
      if (err) throw err
      output[name] = word > 1 << 15 ? word - (2 << 15) : word
      readWordLoop(register, name)
    })
  }

  bus.writeByte(deviceAddress, sensor.CTRL9_XL, 0x38, err => {
    if (err) return cb(err)
    bus.writeByte(deviceAddress, sensor.CTRL1_XL, 0x63, err => {
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

    readWordLoop(sensor.OUTX_L_XL, 'accelerationX')
    readWordLoop(sensor.OUTY_L_XL, 'accelerationY')
    readWordLoop(sensor.OUTZ_L_XL, 'accelerationZ')

    logInterval = setInterval(() => {
      const accelerationX = pad(
        toMetersPerSecond(output.accelerationX).toFixed(2),
        6
      )
      const accelerationY = pad(
        toMetersPerSecond(output.accelerationY).toFixed(2),
        6
      )
      const accelerationZ = pad(
        toMetersPerSecond(output.accelerationZ).toFixed(2),
        6
      )
      continousLog(`${accelerationX} | ${accelerationY} | ${accelerationZ}`)
    }, 50)
  })
})
