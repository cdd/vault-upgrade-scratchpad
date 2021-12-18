import axios from 'axios'

export default function globalErrorReporter(event) {
  const { error, filename, message, lineno, colno } = event
  const { name, stack } = error || {}
  const url = location.href
  const { browser } = $

  const data = {
    url, filename, lineno, colno, name, message, stack, browser,
  }

  return axios({ url: '/javascript_errors', method: 'post', data: data })
}
