import { Terminology } from 'javascripts/cross_app_utilities.js'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

window.setUpSaltAutocomplete = function () {
  const no_salt_name = 'No Salt, free base or acid'
  $('.edit_specified_batch').on('submit', function (event) {
    var message = 'Changing the salt will change the name of this ' + Terminology.dictionary.batch + '. Are you sure you want to perform this operation?',
      submit_button = $('#edit_specified_batch_' + $('.edit_specified_batch').data('batch-id') + '_submit')
    if ($(this).data('salt-change')) {
      const originalSaltName = $(this).find('[data-original-salt-name]').data('original-salt-name') || no_salt_name
      const newSaltName = $(this).find('[name*=salt_name]').val() || no_salt_name
      if (originalSaltName !== newSaltName) {
        var confirmation = confirm(message)
        if (!confirmation) {
          event.preventDefault()
          submit_button.off('click')
          submit_button.on('click', function () { $(this).submit() })
          submit_button.removeClass('disabled')
          return false
        }
      }
    }
  })
}

$(window.setUpSaltAutocomplete)

$(document).ready(() => {
  const form = $('#molecule-definition-form')
  const numEntries = form.data('num-entries-with-attached-structures')
  const structureField = form.find('#molecule_smiles')
  if (numEntries && structureField.val().trim()) {
    const molecule = Terminology.dictionary['molecule']
    const entry = Terminology.dictionary[numEntries == 1 ? 'entry' : 'entry.other']
    const title = 'Confirm Structure Update'
    const content = `Changing the structure will remove associations to this ${molecule} for ${numEntries} ELN ${entry}.`
    structureField.data('original-structure', structureField.val().trim())
    form.submit(event => {
      if (structureField.data('original-structure') !== structureField.val().trim()) {
        ConfirmDialog({ title, content }).then(() => {
          structureField.data('original-structure', structureField.val().trim())
          form.submit()
        }).catch(() => {
          form[0].enableSubmit()
        })
        return false
      }
    })
  }
})
