// Copied from vision's vault: vision/app/scripts/cross_app_utilities.js
window.onerror = function (message, url, line, columnNumber, errorObject) {
  'use strict'

  var errorKey = [Date.now().toString(), Math.ceil((Math.random() * 1000)).toString()].join('/')

  var error = {
    baseLocation: window.location.href,
    message: message,
    jsLocation: url,
    lineNumber: line,
    columnNumber: columnNumber,
    stack: (errorObject ? errorObject.stack : []),
  }

  window.localStorage.setItem(errorKey, JSON.stringify(error))
}

window.getErrors = function () {
  'use strict'

  // Ignore logging messages
  var keyToIgnore = 'loglevel'
  window.localStorage.removeItem(keyToIgnore)

  if (window.localStorage.length > 0) {
    var errors = JSON.stringify(window.localStorage)
    window.localStorage.clear()
    return errors
  } else {
    return null
  }
}
window.CDD = window.CDD || {}
window.CDD.Terminology = {
  dictionary: {},
  t: function (term) {
    'use strict'
    return this.dictionary[term] || term
  },
}

export const Terminology = window.CDD.Terminology

window.keys = function (obj) {
  'use strict'

  var results = []
  for (var propertyName in obj) {
    results.push(propertyName)
  }
  return results
}
