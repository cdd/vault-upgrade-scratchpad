// Common configuration applying to client and server configuration

const { webpackConfig: baseClientWebpackConfig, merge } = require('shakapacker')
const path = require('path')

const commonOptions = {
  resolve: {
      extensions: ['.css', '.ts', '.tsx'],
      alias: {
        '@': path.join(__dirname, '../../app/frontend'),
        'ASSETS': path.join(__dirname, '../../app/assets'),
        'LIB': path.join(__dirname, '../../lib/eln'),
        '#': path.resolve(__dirname, '../../spec/frontend'),
        'SPECS': path.resolve(__dirname, '../../spec/frontend'),
        'STOICH': path.resolve(__dirname, '../../app/frontend/Eln/Entry/components/Editor/Structure/StoichiometryTable'),
      },
  }
}


// environment.config.merge({
//   resolve: {

//     modules: [
//       path.join('./node_modules'),
//     ],
//     symlinks: false,
//   }
// });

// Copy the object using merge b/c the baseClientWebpackConfig and commonOptions are mutable globals
const commonWebpackConfig = () => (merge({}, baseClientWebpackConfig, commonOptions))

module.exports = commonWebpackConfig
