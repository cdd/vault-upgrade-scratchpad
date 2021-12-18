const environment = require('./environment')
var webpack = require('webpack');
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

environment.plugins.append(
  'CommonsChunkCommons',
  new CommonsChunkPlugin({
    name: 'commons',
    minChunks: 2
  })
)

environment.plugins.append(
  'OccurrenceOrderPlugin',
  new webpack.optimize.OccurrenceOrderPlugin()
)

module.exports = environment.toWebpackConfig()
