// config/webpack/test.js
const clientWebpackConfig = require('./clientWebpackConfig')
const webpack = require('webpack');
const { merge } = require('shakapacker')

process.env.NODE_ENV = 'development'

// const webpackConfig = require('./base')
// const webpackConfig = require('./clientWebpackConfig')
const webpackConfig = clientWebpackConfig; // require('./development')[0]

const processConf = {
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_DEBUG: JSON.stringify(false),
      TARGET: JSON.stringify('browser'),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    }),
  ],
  resolve: {
    fallback: { util: require.resolve("util/") },
  },
}

// Get rid of unsupported karma config entries
delete webpackConfig.output?.filename
delete webpackConfig.entry
// module.exports = merge(webpackConfig, processConf)


const testEnvOnly = (clientWebpackConfig) => {
  clientWebpackConfig.plugins.push(
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, '../../tsconfig.json')
      },
      async: false
    })
  )
}
module.exports = webpackConfig(testEnvOnly)


console.log(module.exports)