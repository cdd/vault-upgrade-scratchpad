const { environment, config } = require('@rails/webpacker')
const { join } = require('path')
const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const InjectPlugin = require('webpack-inject-plugin').default
const output_dir = path.join(__dirname, '..', '..', 'public', 'packs')

// using the solution from https://github.com/rails/webpacker/issues/url to get assets emitted
// with the default webpacker 3 path names for compatibility.
const fileLoader = environment.loaders.get('file')
fileLoader.use[0].options.name = '[path][name]-[hash].[ext]'
fileLoader.use[0].options.context = join(config.source_path)

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

environment.config.merge({
  resolve: {
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
});

environment.config.module = {
  rules: [
    {
      test: /constants\.js\.erb$/,
      enforce: 'pre',
      loader: 'rails-erb-loader',
    }
  ],
}

/**
 * Scott's egregious hack to inject some code into every pack.
 *
 * This is terrible, as is the problem it's intended to solve, which is that packs that reference
 * jQuery seem to cause $ to be overwritten with a fresh object that doesn't have our augmentation
 * ($.browser, etc).
 *
 * For whatever reason, this problem didn't occur with webpack 3's CommonsChunkCommons, but that is
 * now deprecated. Perhaps we can address this problem in a simpler way and remove this hack.
 */
environment.plugins.append(
  'InjectPlugin',
  new InjectPlugin(function () {
    return "require('" + path.resolve(path.join(__dirname,
      '../../app/assets/javascripts/global_pack_inject.js')) + "')"
  })
);

module.exports = environment
