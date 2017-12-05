const winston = require('winston').cli()

process.on('message', message => {
  winston.info(`[TLW] ${message.body.timestamp}`)
})
