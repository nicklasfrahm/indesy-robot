const i2cBus = require('i2c-bus').openSync(1)
const {
  LSM6DS3_ADDRESS,
  STATUS_REG,
  OUT_TEMP_L,
  OUT_TEMP_H
} = require('./LSM6DS3')

const timer = setInterval(readTemperature, 1000)

function readTemperature() {
  let temp = 0
  i2cBus.readWord(DS1621_ADDR, OUT_TEMP_H, (err, tempHigh) => {
    if (err) return console.err(err)
    temp |= tempHigh << 8
    i2cBus.readWord(DS1621_ADDR, OUT_TEMP_L, (err, tempLow) => {
      if (err) return console.err(err)
      temp |= tempLow << 0
      process.stdout.write(`Temperature: ${temp}`)
    })
  })
}
