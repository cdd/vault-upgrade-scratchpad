// karma.conf.js
const webpackConfig = require('../config/webpack/test.js')

console.log(webpackConfig)
module.exports = function(config) {
  config.set({
    basePath: '',
    plugins: [
      'karma-webpack',
      'karma-chai',
      'karma-mocha',
      'karma-sinon',
      'karma-chrome-launcher',
      'karma-spec-reporter',
    ],
    files: [
      '../spec/**/*.{jsx|tsx}',
    ],
    preprocessors: {
      '../**/*.spec.jsx': ['webpack'],
    },
    reporters: ['spec'],
    specReporter: {
      maxLogLines: 5,         // limit number of lines logged per test
      suppressErrorSummary: false,  // print error summary
      suppressFailed: false,  // print information about failed tests
      suppressPassed: false,  // print information about passed tests
      suppressSkipped: false,  // print information about skipped tests
      showSpecTiming: true // print the time elapsed for each spec
    },
    exclude: [],
    webpack: webpackConfig,
    frameworks: [ 'chai', 'mocha', 'sinon', 'webpack' ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: true,
  });
};
// const webpackConfig = require('./webpack/test.js')
// const selenium_webdriver = require('selenium-webdriver')

// // let plugins = [
// //   require('karma-chrome-launcher'),
// //   require('karma-chai'),
// //   require('karma-jquery'),
// //   require('karma-mocha'),
// //   require('karma-mocha-reporter'),
// //   require('karma-sinon'),
// //   require('karma-sourcemap-loader'),
// //   require('karma-webpack'),
// //   require('karma-selenium-webdriver-launcher'),
// // ]

// const plugins = [
//   'karma-chrome-launcher',
//   'karma-chai',
//   'karma-jquery',
//   'karma-mocha',
//   'karma-mocha-reporter',
//   'karma-sinon',
//   'karma-sourcemap-loader',
//   'karma-webpack',
//   'karma-selenium-webdriver-launcher',
// ]

// var hostname = 'localhost'
// let port = 9876
// let browsers
// if (process.env.DOCKER_CONTAINER === 'true') {
//   browsers = ['CI_Chrome']
//   hostname = 'node.test'
// } else if (process.env.NODE_ENV === 'test' || process.env.HEADLESS === 'true') {
//   browsers = ['ChromeHeadlessNoSandbox']
// } else {
//   browsers = ['Chrome']
// }

// module.exports = function (config) {
//   config.set({
//     browsers,
//     hostname,
//     port,
//     plugins,
//     // logLevel: config.LOG_DEBUG,
//     // karma only needs to know about the test bundle
//     files: [
//       '../spec/frontend/index.js',
//     ],
//     frameworks: [ 'chai', 'mocha', 'sinon', 'webpack' ],
//     // run the bundle through the webpack and sourcemap plugins
//     preprocessors: {
//       '../spec/frontend/index.js': ['webpack', 'sourcemap'],
//       '**/*.spec.*': ['webpack', 'sourcemap'],
//     },
//     reporters: ['mocha'],
//     mochaReporter: {
//       showDiff: true,
//     },
//     customLaunchers: {
//       ChromeHeadlessNoSandbox: {
//         base: 'ChromeHeadless',
//         flags: ['--no-sandbox'],
//       },
//       CI_Chrome: {
//         base: 'SeleniumWebdriver',
//         browserName: 'Chrome',
//         getDriver: function () {
//           return new selenium_webdriver.Builder()
//             .forBrowser('chrome')
//             .usingServer('http://selenium:4444/wd/hub')
//             .build()
//         },
//       },
//     },
//     singleRun: !config.watch,
//     webpack: {
//       ...webpackConfig,
//       resolve: {
//         ...webpackConfig.resolve,
//         fallback: {
//           util: require.resolve("util/")
//         }
//       },
//     },
//     // webpack: Object.assign({}, webpackConfig, {
//     //   bail: !config.watch,
//     //   devtool: 'inline-source-map',
//     // }),
//     webpackMiddleware: {
//       noInfo: true,
//     },
//     client: {
//       captureConsole: true,
//     },
//     restartOnFileChange: true,
//   })
//   // console.log(config)
// }
