// This file enables the passing of Rails truths to the frontend to
// avoid multiple definitions Only Rails constants should be put here as
// this is precompiled and cached on production

import { fromJS } from 'immutable'

import sharedConstants from './shared_constants.json'

class UndefinedConstant extends Error {
  constructor(prop, ...rest) {
    super(prop, ...rest)

    this.message = `
Undefined shared constant ${prop}. Please see app/models/shared_constants.rb
`
  }
}

const constants = new Proxy({}, {
  get: (obj, prop) => {
    if (prop in obj) {
      return obj[prop]
    } else if (prop in sharedConstants && typeof sharedConstants[prop] !== 'undefined') {
      return obj[prop] = fromJS(sharedConstants[prop])
    } else {
      throw (new UndefinedConstant(prop))
    }
  },
})

// for (var key in sharedConstants) {
//   constants[key] // jslint ignore:line because this is faulting in all the values so that imports work
// }

export default constants
