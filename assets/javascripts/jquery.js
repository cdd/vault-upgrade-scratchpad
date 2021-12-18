import jQuery from 'jquery'

import browser from 'jquery-browser-plugin'

import 'jquery-ui-bundle/jquery-ui.js'
import './jquery_ext.js'
import 'jquery-ujs'
import './compatibility.jquery.js'
// import { sanitizeUrl } from '@/shared/utils'

global.$ = global.jQuery = jQuery
jQuery.browser = browser

export { $, jQuery }
export default jQuery

jQuery.ajaxPrefilter(options => {
  if (options.url) {
    options.url = (options.url)
  }
})
