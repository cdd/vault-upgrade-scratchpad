const environment = require("./environment.js")
const webpack = require("webpack")
const path = require('path')

const defaultConfig = environment.toWebpackConfig()

const outputDir = path.join(__dirname, '../../script/');

let server = {}

server.target = 'node'

server.entry  = {
  'slate-server': [
    './lib/eln/modules/jsdom-global.js',
    './lib/eln/slate-server.js',
  ]
}

server.output = {
  path: outputDir,
  filename: '[name].js'
}

server.devServer = {
  port: 3036
}

server.resolve = defaultConfig.resolve
server.module  = defaultConfig.module

server.plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      RAILS_ENV: JSON.stringify(process.env.RAILS_ENV)
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

module.exports = server
