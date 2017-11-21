const i2cBus = require('i2c-bus').openSync(1)
const {
  LSM6DS3_ADDRESS,
  STATUS_REG,
  OUT_TEMP_L,
  OUT_TEMP_H
} = require('./LSM6DS3')

function handleError(err) {
  process.stdout.write(`[GXL] ${err.message}\n`)
}

function readTemperature() {
  let temp = 0
  i2cBus.readWord(LSM6DS3_ADDRESS, OUT_TEMP_H, (err, tempHigh) => {
    if (err) return handleError(err)
    temp |= tempHigh << 8
    i2cBus.readWord(LSM6DS3_ADDRESS, OUT_TEMP_L, (err, tempLow) => {
      if (err) return handleError(err)
      temp |= tempLow << 0
      process.stdout.write(`[GXL] Temperature: ${temp}\n`)
    })
  })
}

const timer = setInterval(readTemperature, 1000)
