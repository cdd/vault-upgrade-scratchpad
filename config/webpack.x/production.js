const environment = require('./environment')
const webpack = require('webpack');

environment.config.merge({
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "commons",
          chunks: "all"
        }
      }
    },
  },
});

environment.plugins.append(
  'OccurrenceOrderPlugin',
  new webpack.optimize.OccurrenceOrderPlugin()
)

module.exports = environment.toWebpackConfig()
