import { Controller } from 'stimulus'
import jQuery from 'jquery'
import 'jquery-ui-bundle/jquery-ui' // Needed for the highlight effect

// = copy_to_clipboard_controller do
//   = text_field(..., data: { target: "copy-to-clipboard.source" })
//   = link_to("#", data: { action: "copy-to-clipboard#copy" })
export default class extends Controller {
  static targets = [ 'source' ]

  copy(event) {
    event.preventDefault()
    this.sourceTarget.select()
    document.execCommand('copy')
    jQuery(event.currentTarget).effect('highlight')
  }
}
