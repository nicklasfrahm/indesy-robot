const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()
const readline = require('readline')
const sensor = require('./LSM6DS3')
const {
  roundTo,
  toMetersPerSecondSquared,
  toRadiansPerSecond
} = require('./util')

const deviceAddress = 0x6a
let logInterval = null
let bus = null
let output = {
  accX: 0,
  accY: 0,
  accZ: 0,
  gyroX: 0,
  gyroY: 0,
  gyroZ: 0
}
let position = { x: 0, y: 0, z: 0 }
let velocity = { x: 0, y: 0, z: 0 }
let orientation = { x: 0, y: 0, z: 0 }

function continousLog(message) {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(message)
}

function initializeSensor(cb) {
  readWordLoop = (register, property, converter) => {
    bus.readWord(deviceAddress, register, (err, word) => {
      if (err) throw err
      const signed = word > 1 << 15 ? word - (2 << 15) : word
      output[property] = converter ? converter(signed) : signed
      readWordLoop(register, property, converter)
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

    readWordLoop(sensor.OUTX_L_XL, 'accX', toMetersPerSecondSquared)
    readWordLoop(sensor.OUTY_L_XL, 'accY', toMetersPerSecondSquared)
    readWordLoop(sensor.OUTZ_L_XL, 'accZ', toMetersPerSecondSquared)
    readWordLoop(sensor.OUTX_L_G, 'gyroX', toRadiansPerSecond)
    readWordLoop(sensor.OUTY_L_G, 'gyroY', toRadiansPerSecond)
    readWordLoop(sensor.OUTZ_L_G, 'gyroZ', toRadiansPerSecond)

    trackingInterval = setInterval(() => {
      let totalAcceleration = 0

      totalAcceleration += Math.pow(output.accX, 2)
      totalAcceleration += Math.pow(output.accY, 2)
      totalAcceleration += Math.pow(output.accZ, 2)

      totalAcceleration = Math.sqrt(totalAcceleration)

      const res = {
        x: roundTo(Math.acos(output.accY / totalAcceleration), 2),
        y: roundTo(Math.asin(output.accX / totalAcceleration), 2),
        z: roundTo(Math.asin(output.accY / totalAcceleration), 2)
      }
      continousLog(`${res.x} | ${res.y} | ${res.z}`)
    }, 500)
  })
})
