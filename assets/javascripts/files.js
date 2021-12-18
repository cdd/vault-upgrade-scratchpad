import qq from 'fine-uploader/lib/core'

if (typeof window.CDD === 'undefined') { window.CDD = {} }

function setReadoutFile(targetInput, preview, fileId) {
  var targetRow = targetInput.closest('tr')
  var fileDiv = targetRow.find('.file')
  var filePreviewDiv = fileDiv.find('.filePreview')
  var noFileDiv = targetRow.find('.noSelectedFile')

  filePreviewDiv.remove()
  fileDiv.prepend(preview)
  targetInput.val(fileId)
  fileDiv.show()
  noFileDiv.hide()
}

window.removeReadoutFile = function (link) {
  var fileDiv = $(link).closest('.file')
  var noFileDiv = fileDiv.next('.noSelectedFile')
  fileDiv.prev('input').val('')
  fileDiv.hide()
  noFileDiv.show()
}

window.openSingleFileSelector = function () {
  var url = $(this).data('selectSingleFilesPath')
  var requestingRow = $(this).closest('tr')

  var fileInput = requestingRow.find('input')
  var selectedId = fileInput.val()
  var fullUrl = url + '?target_input_id=' + fileInput.attr('id') + '&id=' + selectedId
  var selector = window.open(fullUrl, 'fileselector', 'width=700,height=500,scrollbars=yes,menubar=no,status=no,directories=no,location=no,toolbar=no')
  selector.__isChildWindow = true
  selector.focus()
}

function processSingleFileSelection(form, targetInputId) {
  var targetInput = $('#' + targetInputId)
  if (targetInput === null) { return } // not there anymore
  $(form).find(':radio[name=\'files[]\']').each(function () {
    var that = $(this)
    if (that.prop('checked')) {
      setReadoutFile(targetInput, that.val(), that.data('fileId'))
    }
  })
}
window.processSingleFileSelection = processSingleFileSelection;

(function () {
  var setupNewReadoutFileUploader = function () {
    var buttonElement = $(this)
    if (buttonElement.data('fileUploaderSetup')) { return } // already setup

    var formRow = buttonElement.parents('tr')
    var uploadDiv = formRow.find('.fileUpload')
    var uploadStatus = uploadDiv.find('.status')
    var fileDiv = formRow.find('.file')
    var noFileDiv = formRow.find('.noSelectedFile')
    var readoutRowForm = buttonElement.parents('form')
    var targetInput = formRow.find('input').filter(function () { return this.type !== 'file' })

    new qq.FineUploaderBasic({
      button: buttonElement[0],
      request: {
        endpoint: buttonElement.attr('data-upload-endpoint'),
        params: {
          format: 'json',
          authenticity_token: $.rails.csrfToken(),
        },
      },
      callbacks: {
        onSubmit: function (id, fileName) {
          readoutRowForm[0].disableSubmit()
          fileDiv.hide()
          noFileDiv.hide()
          uploadStatus.text('')
          uploadDiv.show()
        },
        onUpload: function (id, fileName) {
          uploadStatus.html('Uploading ' + '“' + fileName.escapeHTML() + '”')
        },
        onProgress: function (id, fileName, loaded, total) {
          if (loaded < total) {
            var progress = Math.round(loaded / total * 100) + '% of ' + Math.round(total / 1024) + ' kB'
            uploadStatus.html('Uploading ' + '“' + fileName.escapeHTML() + '”: ' + progress)
          } else {
            uploadStatus.html('Saving ' + '“' + fileName.escapeHTML() + '”')
          }
        },
        onComplete: function (id, fileName, responseJSON) {
          uploadDiv.hide()
          if (responseJSON.success) {
            if (responseJSON.reload_page) {
              window.location.reload()
            } else {
              setReadoutFile(targetInput, responseJSON.file_preview.unescapeHTML(), responseJSON.uploaded_file_id)
            }
          } else {
            noFileDiv.show()
            alert('Something went wrong: ' + responseJSON)
          }
          readoutRowForm[0].enableSubmit()
        },
        onError: function (id, name, reason, xhr) {
          uploadDiv.hide()
          noFileDiv.show()
          alert('Something went wrong: ' + reason)
        },
      },
    })
    buttonElement.data('fileUploaderSetup', true)
  }

  var setupNewFormsWithoutNewReadoutFileUploader = window.CDD.Form.setupNewForms // augmenting new form setup
  window.CDD.Form.setupNewForms = function () {
    setupNewFormsWithoutNewReadoutFileUploader()
    $('.readoutFileUploader').each(setupNewReadoutFileUploader)
  }
})()
