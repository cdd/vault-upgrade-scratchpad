const environment = require("./environment.js")
const webpack = require("webpack")
const path = require('path')

const defaultConfig = environment.toWebpackConfig()

let server = {}

server.target = 'node'

server.resolve = defaultConfig.resolve
server.module  = defaultConfig.module

server.plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      RAILS_ENV: JSON.stringify(process.env.RAILS_ENV),
    }
  }),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    'window.$': 'jquery',
    _: 'lodash',
  }),
]

server.output = {
  devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
},

server.devtool = 'inline-cheap-module-source-map'

module.exports = server
