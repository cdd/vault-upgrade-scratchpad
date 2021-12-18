const environment = require('./environment')
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
const sharedTest = require('./sharedTest')

environment.plugins.append(
  'CommonsChunkCommons',
  new CommonsChunkPlugin({
    name: 'commons',
    minChunks: 2,
  }),
  { before: 'manifest' }
)

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

module.exports = environment.toWebpackConfig()
