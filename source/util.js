exports.roundTo = function(n, digits) {
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
