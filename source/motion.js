const i2c = require('i2c-bus')
const winston = require('winston').cli()
const os = require('os').platform()

let bus = null

sensor.address = 0x6a
sensor.temp = 0x20
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

function readWord(address) {
  bus.readWord(DS1621_ADDR, address, function(err, data) {
    if (err) throw err
    console.log(data)
    readWord(address)
  })
}

bus = i2c.open(1, function(err) {
  if (err) throw err
  readWord(sensor.OUT_TEMP_H)
})
