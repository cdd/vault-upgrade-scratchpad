import { Controller } from 'stimulus'
import axios from 'axios'
import isUrl from 'is-url'

export default class extends Controller {
  connect() {
    const url = this.data.get('url')

    // only accept relative paths to our resources
    if (!url || isUrl(url)) return

    return axios.get(url)
      .then(response => {
        this.element.outerHTML = response.data // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml
      })
  }
}
