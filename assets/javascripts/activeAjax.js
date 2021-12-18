let count = 0

const start = () => {
  count++

  $('#globalAjax').show()
}

const stop = () => {
  count--

  if (count < 1) {
    count = 0
    $('#globalAjax').hide()

    if (CDD && CDD.setupCalendarFields) {
      $(CDD.setupCalendarFields)
    }
  }
}

// XXX: only used for testing
const reset = () => {
  count = 0
  $('#globalAjax').hide()
}

const getCount = () => {
  return count
}

const activeAjax = {
  start,
  stop,
  reset,
  getCount,
}

export default activeAjax
