const { exec } = require('child_process')
const winston = require('winston')

winston.cli()

function runCmd(cmd) {
  return cb => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) winston.error(`${err.message}\n${stdout}\n${stderr}`)
      if (cb && typeof cb === 'function') return cb()
    })
  }
}

exports.gitPull = runCmd('git pull')
exports.rmNodeModules = runCmd('rm -r node_modules')
exports.npmInstall = runCmd('npm install')
exports.pm2ReloadAll = runCmd('pm2 reload all')

exports.runUpdate = cb => {
  exports.gitPull(() => {
    exports.rmNodeModules(() => {
      exports.npmInstall(() => {
        exports.pm2ReloadAll(cb)
      })
    })
  })
}
