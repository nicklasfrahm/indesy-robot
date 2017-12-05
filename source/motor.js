// TO BE REFACTORED
// SHOULD USE IPC COMMUNICATION

//define motor GPIO pins
const motors = {
  left: {
    gpios: [
      new Gpio(14, { mode: Gpio.OUTPUT }),
      new Gpio(15, { mode: Gpio.OUTPUT })
    ],
    status: STOP
  },
  right: {
    gpios: [
      new Gpio(23, { mode: Gpio.OUTPUT }),
      new Gpio(24, { mode: Gpio.OUTPUT })
    ],
    status: STOP
  }
}
//control motors: 00 STOP, 01 CW, 10 CCW, 11 BRAKEsocket.on('controlMovement', data => {
console.log(data)
if (data && data.buttons && data.duty !== undefined) {
  duty = Math.abs(Math.floor(data.duty * MAXDUTY / 100))
  let forward = data.duty > 0

  if (~data.buttons.indexOf('L')) {
    motors.right.gpios[forward ? 0 : 1].pwmWrite(0)
    motors.right.gpios[forward ? 1 : 0].pwmWrite(duty)
  } else {
    motors.right.gpios[0].pwmWrite(MAXDUTY)
    motors.right.gpios[1].pwmWrite(MAXDUTY)
  }
  if (~data.buttons.indexOf('R')) {
    motors.left.gpios[forward ? 0 : 1].pwmWrite(0)
    motors.left.gpios[forward ? 1 : 0].pwmWrite(duty)
  } else {
    motors.left.gpios[0].pwmWrite(MAXDUTY)
    motors.left.gpios[1].pwmWrite(MAXDUTY)
  }
}
