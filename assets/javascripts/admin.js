require('jquery-ui-bundle/jquery-ui')

$(function () {
  $('#new_user, #new_vault, #new_salt, #edit_snapshot')
    .focusFirst()
})

$(function () {
  $('#vault_query').keypress(function (e) {
    if (e.keyCode == $.ui.keyCode.ENTER) {
      this.form.submit()
    }
  })
})

$(function () {
  $('#switch_user_username').autocomplete({
    minLength: 2,
    autoFocus: true,
    html: true,
    source: $('#switch_user_username').data('autocompleteUrl'),
  })
})
