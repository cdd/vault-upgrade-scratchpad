const path = require('path')

const apply = config => {
  config.entry.set('frontend', path.join(__dirname, '../../app/ChemicalPropertiesSearch/index.js'))

  // this currently breaks things:
  // config.entry.set('specs', path.join(__dirname, '../../spec/frontend/index.js'))

  // this appears to be unnecessary as of webpack 3
  // config.loaders.append('json', {
  //   test: /\.json$/,
  //   loader: 'json-loader',
  // })

  config.loaders.append('yaml', {
    test: /\.ya?ml$/,
    include: path.resolve('data'),
    use: 'yaml-loader',
    type: 'json',
  })

  config.loaders.append('text', {
    test: /\.(html|txt)$/,
    loader: 'raw-loader',
  })

  return config
}

module.exports = { apply }
