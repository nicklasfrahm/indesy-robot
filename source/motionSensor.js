const bus = require('i2c-bus').openSync(1)
const {
  LSM6DS3_ADDRESS,
  STATUS_REG,
  OUT_TEMP_L,
  OUT_TEMP_H
} = require('./LSM6DS3')

function handleError(err) {
  winston.error(`[GXL] ${err.message}`)
}

function readTemperature() {
  let temp = 0
  bus.readByte(LSM6DS3_ADDRESS, OUT_TEMP_H, (err, tempHigh) => {
    if (err) return handleError(err)
    temp |= tempHigh << 8
    winston.info(`[GXL] ${temp} ${tempHigh}`)
    bus.readByte(LSM6DS3_ADDRESS, OUT_TEMP_L, (err, tempLow) => {
      if (err) return handleError(err)
      temp |= tempLow << 0
      winston.info(`[GXL] ${temp} ${tempLow}`)
      winston.info(`[GXL] Temperature: ${temp}`)
    })
  })
}

const timer = setInterval(readTemperature, 1000)
