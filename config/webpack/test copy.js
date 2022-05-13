const webpackConfig = require('./ServerClientOrBoth')

const testOnly = (_clientWebpackConfig, _serverWebpackConfig) => {
  // place any code here that is for test only
}

const test = webpackConfig(testOnly)
// console.log(test)
module.exports = test
