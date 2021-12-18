import { isEmpty } from 'lodash'

if (window.CDD === undefined) {
  window.CDD = {}
}

// TODO: maybe always render these with rails, but with display none?
const insertGlobal = ({ id, className }) => message => {
  let globalEl = $(id)

  if (isEmpty(message)) {
    return globalEl.remove()
  }

  if (globalEl.length === 0) {
    globalEl = $('<div />') // eslint-disable-line jquery-unsafe/no-prependTo
      .attr('id', id)
      .addClass(`section ${className}`)
      .prependTo('#content-inner')
  }

  return globalEl.html($('<p />').html(message)) // eslint-disable-line jquery-unsafe/no-html
}

const insertGlobalNotice = insertGlobal({ id: 'globalNotice', className: 'successMessage' })
const insertGlobalError = insertGlobal({ id: 'globalError', className: 'errorMessage' })
const insertGlobalWarning = insertGlobal({ id: 'globalWarning', className: 'warningMessage' })

window.CDD.ShareDialog = {
  open: function (shareLink, shareURL) {
    this.destroy()
    $.ajax(shareURL, {
      async: true,
      method: 'GET',
      success: function (data) {
        $(shareLink).parent().append(data) // eslint-disable-line jquery-unsafe/no-append
      },
    })
  },

  destroy: function () {
    $('#shareDialog').remove()
  },

  afterMessageSubmission: function (data) {
    if (data.success) {
      this.destroy()
      insertGlobalNotice('<p>Message successfully <a href="' + data.messagePath.escapeHTML() + '">posted</a>.</p>')
    } else {
      var errorElement = $('#shareDialog-errors')
      var formattedErrorList = '<ul>' + data.errors.map(function (error) {
        return '<li>' + error.escapeHTML() + '</li>'
      }).join('') + '</ul>'
      errorElement.html('<p>Please address the following issues:</p>' + formattedErrorList).show()
      $('#shareDialog-message')[0].enableSubmit()
    }
  },
}

window.removeAssociatedModel = function () {
  $(this).closest('.associated-model').hide().find('input[type=hidden][name$="[_destroy]"]').val(1)
  $(this).trigger('cdd:removeAssociatedModel')
}

export function performEasyTextCopyForLinkElement(linkElement) {
  const text = linkElement.attr('data-easy-text-copy')
  const container = linkElement.parents().not('span').first().find('.text-copy-target')

  container.val(text)
  container.show().focus()
  linkElement.siblings().filter('.active').removeClass('active').addClass('muted')
  linkElement.addClass('active').removeClass('muted')
}

window.attemptToCopy = function () {
  const linkElement = $(this)

  performEasyTextCopyForLinkElement(linkElement)
}

export {
  insertGlobalError,
  insertGlobalNotice,
  insertGlobalWarning,
}
