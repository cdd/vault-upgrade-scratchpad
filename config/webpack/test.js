const environment = require('./environment')
const sharedTest = require('./sharedTest')
var path = require('path')
var output_dir = path.join(__dirname, '..', '..', 'public', 'packs-test')

environment.plugins.get('Manifest').opts.writeToFileEmit = false
// eslint-disable-next-line no-console
console.log(output_dir)

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
