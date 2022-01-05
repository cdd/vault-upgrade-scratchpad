const path = require('path')

const apply = config => {
  config.entry.set('specs', path.join(__dirname, '../../spec/frontend/index.js'))

  config.loaders.append('json', {
    test: /\.json$/,
    loader: 'json-loader',
  })

  config.loaders.append('yaml', {
    test: /\.ya?ml$/,
    include: path.resolve('data'),
    use: 'yaml-loader',
  })

  config.loaders.append('text', {
    test: /\.(html|txt)$/,
    loader: 'raw-loader',
  })

  return config
}

module.exports = { apply }
