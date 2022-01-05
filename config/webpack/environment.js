const { environment } = require('@rails/webpacker')
var path = require('path')
var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var output_dir = path.join(__dirname, '..', '..', 'public', 'packs')

// eslint-disable-next-line no-console
console.log('webpack environment (NODE_ENV): ' + process.env.NODE_ENV)

environment.plugins.prepend(
  'CleanWebpackPlugin',
  new CleanWebpackPlugin([
    '*.*',
    'javascripts/*.*',
    'styles/*.*',
    'images/**/*.*',
    '_/**/*.*',
  ], {
    root: output_dir,
    verbose: true,
  })
)

environment.plugins.prepend(
  'Define',
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      RAILS_ENV: JSON.stringify(process.env.RAILS_ENV),
    },
  })
)

environment.plugins.prepend(
  'providePlugin',
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    'window.$': 'jquery',
    _: 'lodash',
    chai: 'chai',
    sinon: 'sinon',
  })
)

environment.config.resolve = {
  alias: {
    '@': path.join(__dirname, '../../app/frontend'),
    'ASSETS': path.join(__dirname, '../../app/assets'),
    'LIB': path.join(__dirname, '../../lib/eln'),
    '#': path.resolve(__dirname, '../../spec/frontend'),
    'SPECS': path.resolve(__dirname, '../../spec/frontend'),
    'STOICH': path.resolve(__dirname, '../../app/frontend/Eln/Entry/components/Editor/Structure/StoichiometryTable'),
  },
  modules: [
    path.join('./node_modules'),
  ],
  symlinks: false,
}

environment.config.module = {
  rules: [
    {
      test: require.resolve('jquery'),
      use: [{
        loader: 'expose-loader',
        options: '$',
      }, {
        loader: 'expose-loader',
        options: 'jQuery',
      }],
    },
    {
      test: /constants\.js\.erb$/,
      enforce: 'pre',
      loader: 'rails-erb-loader',
    },
  ],
}

module.exports = environment
