const winston = require('winston').cli()

const G = 9.81

exports.Logger = function() {
  const worker = process.env.workerName
  this.info = message => winston.info(`[${worker}] ${message}`)
  return this
}

exports.roundTo = (n, digits) => {
  if (digits === undefined) {
    digits = 0
  }
  const multiplicator = Math.pow(10, digits)
  let negative = false
  if (n < 0) {
    negative = true
    n = n * -1
  }
  n = parseFloat((n * multiplicator).toFixed(11))
  n = (Math.round(n) / multiplicator).toFixed(2)
  if (negative) {
    n = (n * -1).toFixed(2)
  }
  return n
}

exports.toMetersPerSecondSquared = raw => raw / (1 << 15) * 2 * G

exports.toRadiansPerSecond = raw => raw / 245 / 360 * 2 * Math.PI
