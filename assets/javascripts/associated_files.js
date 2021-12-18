import qq from 'fine-uploader/lib/core'

window.openAssociatedFileSelector = function () {
  var link = $(this)
  var url = link.data('selectAssociatedFilesPath')
  var hiddenInputs = link.closest('form').find("input:hidden[name$='[file_ids_to_attach][]']")
  var ids = hiddenInputs.toArray().filter(function (e) {
    return e.value.length > 0
  }).map(function (e) {
    return e.value
  })

  var fullUrl = url + '?prefix=' + link.data('prefix') + '&ids=' + ids.join(',')
  var selector = window.open(fullUrl, 'fileselector', 'width=700,height=500,scrollbars=yes,menubar=no,status=no,directories=no,location=no,toolbar=no')
  selector.__isChildWindow = true
  selector.focus()
}

function processAssociatedFileSelections(form) {
  $(form).find('input:checkbox[name=\'files[]\']').toArray().forEach(function (element) {
    if (element.checked) {
      // eslint-disable-next-line jquery-unsafe/no-before
      var marker = $('.files .controls').first().before(element.value.unescapeHTML()) // The value is escaped HTML and it has previously been escaped so that it doesn't get interpreted as HTML
      marker.prev().children().effect('highlight')
    }
  })
}

window.processAssociatedFileSelections = processAssociatedFileSelections;

(function () {
  var setupNewAssociatedFileUploader = function (uploaderElement) {
    uploaderElement = $(uploaderElement)
    if (uploaderElement.data('associated-fileuploader-setup')) { return } // already setup

    var buttonElement = uploaderElement.find('.uploadButton')
    var endpoint = uploaderElement.attr('data-upload-endpoint')
    var template = uploaderElement.find('.template tr')
    var controls = uploaderElement.find('.files .controls')
    var form = uploaderElement.parents('form')
    var errorMessage = uploaderElement.find('.errorMessage')
    var projectSelect = form.find('select#message_project_id')

    var submissionOk = function (uploader) {
      return function () {
        if (uploader.getInProgress() !== 0 || (projectSelect && projectSelect.val() === '')) {
          form[0].disableSubmit()
        } else {
          form[0].enableSubmit()
        }
      }
    }

    var files = []

    function AssociatedFile(fileName, controls) {
      var element = template.clone()
      var status = element.find('.status')
      var progressElement = element.find('progress')
      controls.before(element)

      this.updateProgress = function (loaded, total) {
        if (loaded && total) {
          progressElement.attr('max', total)
          progressElement.attr('value', loaded)
        }
      }

      this.updateStatus = function (updatedStatus) {
        status.html('Uploading ' + fileName.escapeHTML())
      }

      this.updateView = function (updatedView) {
        element.replaceWith(updatedView.unescapeHTML())
      }
    }

    var uploader = new qq.FineUploaderBasic({
      button: buttonElement[0],

      request: {
        endpoint: endpoint,
        params: {
          format: 'json',
          authenticity_token: $.rails.csrfToken(),
        },
      },

      callbacks: {
        onSubmit: function (id, fileName) {
          submissionOk(this)()
          files[id] = new AssociatedFile(fileName, controls)
          files[id].updateStatus('Uploading ' + fileName)
          $(errorMessage).hide()
        },
        onUpload: function (id, fileName) {
          files[id].updateStatus('Uploading ' + fileName)
        },
        onProgress: function (id, fileName, loaded, total) {
          files[id].updateStatus('Uploading ' + fileName)
          files[id].updateProgress(loaded, total)
        },
        onComplete: function (id, fileName, responseJSON) {
          if (responseJSON.reload_page) {
            window.location.reload()
          } else {
            files[id].updateView(responseJSON.file_preview)
          }
          submissionOk(this)()
        },
        onError: function (id, fileName, reason, xhr) {
          submissionOk(this)()
          errorMessage.html(reason.escapeHTML())
          $(errorMessage).show()
        },
      },
    })

    if (projectSelect) {
      projectSelect.on('change', submissionOk(uploader))
    }

    if (document.createElement('progress').max !== undefined) {
      $(uploaderElement).addClass('progress-supported')
    }

    uploaderElement.data('associated-fileuploader-setup', true)
  }

  var setupNewFormsWithoutNewAssociatedFileUploader = CDD.Form.setupNewForms // augmenting new form setup
  CDD.Form.setupNewForms = function () {
    setupNewFormsWithoutNewAssociatedFileUploader()

    $('.associatedFileUploader').toArray().forEach(setupNewAssociatedFileUploader)
  }
})()
