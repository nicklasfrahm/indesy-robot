const { exec } = require('child_process')
const winston = require('winston')

winston.cli()

function reportError(cb) {
  return (err, stdout, stderr) => {
    if (err) winston.error(`${err.message}\n${stdout}\n${stderr}`)
    if (cb && typeof cb === 'function') return cb()
  }
}

exports.pullRepo = cb => {
  exec('git pull', reportError(cb))
}
