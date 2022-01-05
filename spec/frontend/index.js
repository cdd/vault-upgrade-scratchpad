import 'mocha'
import chaiImmutable from 'chai-immutable'
import sinonChai from 'sinon-chai'
import chaiEnzyme from 'chai-enzyme'
import chaiJquery from 'chai-jquery'
// import './support/chai_ext'

import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

require('babel-polyfill')
// require('#/support/stringExtensions.js')
require('@/../assets/javascripts/jquery.js')
// require('@/../assets/javascripts/ejschart/EJSChart.js')
// require('@/../assets/javascripts/ejschart/EJSChart_SVGExport.js')

global.$3Dmol = { notrack: true }

Enzyme.configure({ adapter: new Adapter() })

chai.use(chaiImmutable)
chai.use(sinonChai)
chai.use(chaiEnzyme())
chai.use(chaiJquery)

global.expect = chai.expect

const context = require.context('.', true, /spec\.jsx?$/)

try {
  context.keys().forEach(context)
} catch (e) {
  it('should not have uncaught errors', () => {
    throw e
  })
}

module.exports = context
