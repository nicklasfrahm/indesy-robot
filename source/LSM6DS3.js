const bus = require('i2c-bus').openSync(1)
const winston = require('winson').cli()

const sensor = {}

sensor.STATUS_REG = 0x1e
sensor.OUT_TEMP_L = 0x20
sensor.OUT_TEMP_H = 0x21
sensor.OUTX_L_G = 0x22
sensor.OUTX_H_G = 0x23
sensor.OUTY_L_G = 0x24
sensor.OUTY_H_G = 0x25
sensor.OUTZ_L_G = 0x26
sensor.OUTZ_H_G = 0x27
sensor.OUTX_L_XL = 0x28
sensor.OUTX_H_XL = 0x29
sensor.OUTY_L_XL = 0x2a
sensor.OUTY_H_XL = 0x2b
sensor.OUTZ_L_XL = 0x2c
sensor.OUTZ_H_XL = 0x2d
sensor.ADDRESS = 0x6a

function handleError(err) {
  winston.error(`[GXL] ${err.message}`)
}

function log(msg) {
  winston.info(`[GXL] ${msg}`)
}

function readTemperature() {
  let temp = 0
  bus.readByte(sensor.LSM6DS3_ADDRESS, sensor.OUT_TEMP_H, (err, tempHigh) => {
    if (err) return handleError(err)
    temp |= tempHigh << 8
    log(`[GXL] ${temp} ${tempHigh}`)
    bus.readByte(sensor.LSM6DS3_ADDRESS, sensor.OUT_TEMP_L, (err, tempLow) => {
      if (err) return handleError(err)
      temp |= tempLow << 0
      log(`${temp} ${tempLow}`)
      log(`Temperature: ${temp}`)
    })
  })
}

const timer = setInterval(readTemperature, 1000)
