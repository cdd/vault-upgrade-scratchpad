import axios from 'axios'
import { sanitizeUrl } from '@/shared/utils'

import activeAjax from './activeAjax.js'

const initialize = () => {
  const csrfToken = $.rails.csrfToken()
  axios.defaults.headers.common['X-CSRF-Token'] = csrfToken || ''

  axios.interceptors.request.use(config => {
    if (config.global != false) {
      activeAjax.start()
    }

    if (config.url) {
      config.url = sanitizeUrl(config.url)
    }
    return config
  })

  axios.interceptors.response.use(response => {
    if (response.config.global != false) {
      activeAjax.stop()
    }
    return response
  }, error => {
    if (error.config.global != false) {
      activeAjax.stop()
    }
    return Promise.reject(error)
  })
}

const CDDAxios = {
  initialize,
}

export default CDDAxios
