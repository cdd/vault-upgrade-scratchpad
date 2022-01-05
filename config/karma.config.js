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
    plugins,
    // logLevel: config.LOG_DEBUG,
    // karma only needs to know about the test bundle
    files: [
      '../spec/frontend/index.js',
    ],
    frameworks: [ 'chai', 'mocha', 'sinon', 'jquery-1.11.0' ],
    // run the bundle through the webpack and sourcemap plugins
    preprocessors: {
      '../spec/frontend/index.js': ['webpack', 'sourcemap'],
    },
    reporters: ['mocha'],
    mochaReporter: {
      showDiff: true,
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
    singleRun: !config.watch,
    webpack: Object.assign({}, webpackConfig, {
      bail: !config.watch,
      devtool: 'inline-source-map',
    }),
    webpackMiddleware: {
      noInfo: true,
    },
    client: {
      captureConsole: true,
    },
    restartOnFileChange: true,
  })
}
