let buttonySubmitHandler

export default buttonySubmitHandler = function () {
  function getForm(that) {
    var form = $(that).closest('form')
    if (form.length === 0) {
      form = $('form')
    }
    return form
  }

  function buttonySubmitHandler(ev) {
    ev.preventDefault()

    var form = getForm(this)

    if (form.data('disabled')) {
      ev.stopImmediatePropagation()
      return false
    }

    $(form).data('disabled', true)
    $(form).find('.buttony-submit').addClass('disabled')

    if ($(this).hasClass('show-modal-overlay')) {
      CDD.ModalOverlay.show()
    }

    if ($(this).hasClass('show-global-ajax-notifier')) {
      $('#globalAjax').show()
    }

    $(form).trigger('submit')
  }

  $(document).on('click', '.buttony-submit', buttonySubmitHandler)
}

$(buttonySubmitHandler)
