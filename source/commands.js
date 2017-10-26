const { exec } = require('child_process')
const { platform } = require('os')
const winston = require('winston')

winston.cli()

function runCmd(cmd) {
  return cb => {
    exec(cmd, (err, stdout, stderr) => {
      winston.info(`[CLI] Running command: ${cmd}`)
      if (err) return winston.error(`${err.message}\n${stdout}\n${stderr}`)
      if (cb && typeof cb === 'function') return cb()
    })
  }
}

exports.gitPull = runCmd('git pull')
exports.rmNodeModules = runCmd('rm -r node_modules')
exports.npmInstall = runCmd('npm install')
exports.pm2ReloadAll = runCmd('pm2 reload all')

exports.runUpdate = cb => {
  const osPlatform = platform()
  if (osPlatform === 'linux') {
    winston.info('[CLI] Performing update.')
    exports.gitPull(() => {
      exports.rmNodeModules(() => {
        exports.npmInstall(() => {
          exports.pm2ReloadAll(cb)
        })
      })
    })
  } else {
    winston.info(`[CLI] Aborting update on platform: ${osPlatform}`)
    if (cb && typeof cb === 'function') cb()
  }
}
