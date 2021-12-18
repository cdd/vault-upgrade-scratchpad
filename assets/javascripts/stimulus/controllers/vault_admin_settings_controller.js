import { Controller } from 'stimulus'

// Used on app/views/vault_settings/_form.html.haml
export default class extends Controller {
  static targets = [ 'form', 'prefix', 'submitButton' ]

  prefixChanged() {
    if (!this.hasPrefixTarget) { // Some vaults don't
      return false
    }
    const old_prefix = this.prefixTarget.defaultValue
    const new_prefix = this.prefixTarget.value
    return old_prefix != new_prefix
  }

  changeMessage() {
    return this.submitButtonTarget.getAttribute('data-prefix-confirm')
  }

  submit(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    const message = this.changeMessage()
    if (!this.prefixChanged() || !message || confirm(message)) {
      this.formTarget.submit()
    }
  }
}
