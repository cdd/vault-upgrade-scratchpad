const skipIfMocha = (describe, message = '') => {
  if (window.__skip_failing_mocha_js_tests) {
    // eslint-disable-next-line no-console
    console.warn(`pending for mocha runner (please use karma): ${message}`)
    return describe.skip
  } else {
    // eslint-disable-next-line no-console
    console.info(`marked as pending for mocha runner: ${message}`)
    return describe
  }
}

export default skipIfMocha
