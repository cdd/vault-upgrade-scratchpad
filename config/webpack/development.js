process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = require('./environment')
const sharedTest = require('./sharedTest')

environment.config.merge({
  devtool: 'cheap-module-source-map',
})

environment.loaders.insert('mocha', {
  test: /spec\.[jt]sx?$/,
  exclude: /node_modules/,
  use: {
    loader: 'mocha-loader',
    options: {
      bail: true,
    },
  },
}, { before: 'babel' })

sharedTest.apply(environment)

console.log(environment.toWebpackConfig())
module.exports = environment.toWebpackConfig()
