const { exec } = require('child_process')

exports.pullRepo = cb => {
  exec('git pull', (err, stdout, stderr) => {
    if (err) return console.log(err)
    if (cb && typeof cb === 'function') return cb()
  })
}
