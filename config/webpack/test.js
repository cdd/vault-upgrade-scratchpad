const environment = require('./environment')
const sharedTest = require('./sharedTest')
var path = require('path')
var output_dir = path.join(__dirname, '..', '..', 'public', 'packs-test')

console.log(environment.plugins.get('Manifest'));

environment.plugins.get('Manifest').options.writeToFileEmit = false

environment.config.output = {
  // must match config.webpack.output_dir
  path: output_dir,
  publicPath: 'http://localhost:3036/webpack/',
  filename: '[name].js',
}

environment.config.merge({
  devtool: 'eval-source-map',
})

sharedTest.apply(environment)

module.exports = environment.toWebpackConfig()
