const webpackConfig = require('./webpack/test.js')
const selenium_webdriver = require('selenium-webdriver')

let plugins = [
  require('karma-chrome-launcher'),
  require('karma-chai'),
  require('karma-jquery'),
  require('karma-mocha'),
  require('karma-mocha-reporter'),
  require('karma-sinon'),
  require('karma-sourcemap-loader'),
  require('karma-webpack'),
  require('karma-selenium-webdriver-launcher'),
]

var hostname = 'localhost'
let port = 9876
let browsers
if (process.env.DOCKER_CONTAINER === 'true') {
  browsers = ['CI_Chrome']
  hostname = 'node.test'
} else if (process.env.NODE_ENV === 'test' || process.env.HEADLESS === 'true') {
  browsers = ['ChromeHeadlessNoSandbox']
} else {
  browsers = ['Chrome']
}
module.exports = function (config) {
  config.set({
    browsers,
    hostname,
    port,

    // TODO: include or no?
    plugins,

    singleRun: true, //just run once by default
    frameworks: ['mocha'], //use the mocha test framework
    files: [
      '../spec/frontend/index.js',
    ],
    preprocessors: {
      'tests.webpack.js': [ /* 'webpack', */ 'sourcemap'] //preprocess with webpack and our sourcemap loader
    },
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
      CI_Chrome: {
        base: 'SeleniumWebdriver',
        browserName: 'Chrome',
        getDriver: function () {
          return new selenium_webdriver.Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium:4444/wd/hub')
            .build()
        },
      },
    },
    reporters: ['dots'], //report results in this format
    webpack: { //kind of a copy of your webpack config

      ...webpackConfig,
      bail: !config.watch,
      optimization: {
        runtimeChunk: false,
        splitChunks: false,
      },
      devtool: 'inline-source-map', //just do inline source maps instead of the default
      module: {
        loaders: [
          { test: /\.js$/, loader: 'babel-loader' }
        ]
      }
    },
    webpackServer: {
      noInfo: true //please don't spam the console when running in karma!
    },
    webpackMiddleware: {
      noInfo: true,
    },
    client: {
      captureConsole: true,
    },
    restartOnFileChange: true,
  });
};


// const webpackConfig = require('./webpack/test.js')
// const selenium_webdriver = require('selenium-webdriver')

// let plugins = [
//   require('karma-chrome-launcher'),
//   require('karma-chai'),
//   require('karma-jquery'),
//   require('karma-mocha'),
//   require('karma-mocha-reporter'),
//   require('karma-sinon'),
//   require('karma-sourcemap-loader'),
//   require('karma-webpack'),
//   require('karma-selenium-webdriver-launcher'),
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

//     // TODO: include or no?
//     plugins,

//     // logLevel: config.LOG_DEBUG,
//     // karma only needs to know about the test bundle
//     files: [
//       '../spec/frontend/index.js',
//     ],
//     frameworks: ['chai', 'mocha', 'sinon', 'jquery-1.11.0'],
//     // run the bundle through the webpack and sourcemap plugins
//     preprocessors: {
//       '../spec/frontend/index.js': ['webpack', 'sourcemap'],
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
//       bail: !config.watch,
//       devtool: 'inline-source-map',
//       optimization: {
//         runtimeChunk: false,
//         splitChunks: false,
//       },
//     },
//     webpackMiddleware: {
//       noInfo: true,
//     },
//     client: {
//       captureConsole: true,
//     },
//     restartOnFileChange: true,
//   })
// }