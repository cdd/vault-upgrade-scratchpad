import qq from 'fine-uploader/lib/core'

class DataFile {
  constructor() {
    this.uploadDiv = $('#newUpload')
    this.uploadFileDiv = $('#newUpload-file')
    this.progressDiv = $('#newUploadProgress')
    this.uploadStatus = $('#uploadStatus')
    this.uploadProgressBar = $('#uploadProgressBar')
    this.uploadPercentage = $('#uploadPercentage')
    this.processingDiv = $('#newUploadProcessing')
    this.processingStatus = $('#processingStatus')

    this.params = { format: 'json' }
    this.dataFileId = null
    CDD.storeElementInitialState(this.uploadFileDiv[0]) // Fineuploader eats up the file input field when uploading the file using an iFrame so store its state here so we can put it back
  }

  upload(form) {
    this.form = $(form)
    this.endpoint = this.form.attr('action')
    this.inputs = this.form.find(':input')
    this.fileInput = this.inputs.filter('input:file')
    let params = this.params
    this.inputs.not('input:file').each(function () { params[this.name] = this.value })

    this.manualUploader = this.newManualUploader()
    this.manualUploader.addFiles(this.fileInput.toArray())
    this.manualUploader.uploadStoredFiles()
  }

  displayErrors(errorSectionId) {
    CDD.resetElementToInitialState(this.uploadFileDiv) // Fineuploader eats up the file input field when uploading the file using an iFrame so put it back
    $(this.progressDiv).hide()
    $(this.processingDiv).hide()
    $(this.uploadDiv).find('.errorMessage').hide()
    $(`#${errorSectionId}`).show()
    if (this.form) { // Not present if we arrived from ELN document
      this.form[0].enableSubmit()
    }
    $(this.uploadDiv).show()
  }

  createSlurp() {
    const f = document.createElement('form')
    f.style.display = 'none'
    this.uploadDiv.append(f)
    f.method = 'GET'
    f.action = `${this.endpoint}/${this.dataFileId}/slurps/new`
    const s = document.createElement('input')
    s.setAttribute('type', 'hidden')
    s.setAttribute('name', 'authenticity_token')
    s.setAttribute('value', $.rails.csrfToken())
    f.appendChild(s)
    const i = document.createElement('input')
    i.setAttribute('type', 'hidden')
    i.setAttribute('name', 'interactive')
    i.setAttribute('value', 'true')
    f.appendChild(i)
    f.submit()
  }

  // Used by the poller as an onSuccess callback for the ajax request
  waitForDataFileProcessingCompletion({ state, record_count }) {
    if (state !== 'uploaded') { Pollers.stop('dataFileUpload') }
    if (state === 'ready') {
      this.createSlurp()
    } else if (state === 'too_large') {
      // eslint-disable-next-line jquery-unsafe/no-html
      $('#data_file_record_count').html(record_count)
      this.displayErrors('data_file_too_large')
    } else if (state === 'unparseable') {
      this.displayErrors('data_file_unparseable')
    }
  }

  // Used when we jump from the ELN to data file page when importing an eln document
  skipUpload(filePath, dataFileId, fileName) {
    this.uploadDiv.hide()
    this.endpoint = filePath
    this.dataFileId = dataFileId
    this.showProcessing(window.location.pathname, fileName)
  }

  showProcessing(fileEndpoint, fileName) {
    $(this.progressDiv).hide()
    const parsingString = `Parsing “${fileName.escapeHTML()}”`
    document.title = parsingString
    this.processingStatus.html(parsingString)
    $(this.processingDiv).show()
    Pollers.start('dataFileUpload', fileEndpoint, 2, this.waitForDataFileProcessingCompletion.bind(this))
  }

  newManualUploader() {
    const endpoint = this.endpoint
    let params = this.params
    const _this = this
    return new qq.FineUploaderBasic({
      request: {
        endpoint,
        params,
        inputName: 'data_file[file]',
        customHeaders: {
          'X-CSRF-Token': $.rails.csrfToken(),
        },
      },
      autoUpload: false,
      maxConnections: 1,
      callbacks: {
        onUpload(id, fileName) {
          _this.form[0].disableSubmit()
          $(_this.uploadDiv).hide()
          _this.uploadStatus.html(`Uploading “${fileName.escapeHTML()}”`)
          _this.uploadPercentage.html('') // reset it
          _this.uploadProgressBar.val(null) // indeterminate
          $(_this.progressDiv).show()
        },
        onProgress(id, fileName, loaded, total) {
          if (loaded < total) {
            const percentage = Math.round(loaded / total * 100)
            _this.uploadProgressBar.val(percentage)
            _this.uploadPercentage.html(`${percentage}% of ${Math.round(total / 1024)} kB`)
          } else {
            _this.uploadProgressBar.val(100)
            _this.uploadStatus.html(`Saving “${fileName.escapeHTML()}”`)
          }
        },
        onComplete(id, fileName, { error, reload_page, data_file_id }) {
          if (error) {
            // eslint-disable-next-line jquery-unsafe/no-html
            $('#data_file_issues').html(error.escapeHTML())
            _this.displayErrors('data_file_errors')
            if (reload_page) { window.location.reload() }
          } else if (data_file_id !== undefined) {
            _this.dataFileId = data_file_id
            _this.showProcessing(`${endpoint}/${_this.dataFileId}`, fileName)
          } // else onError will handle
        },
        onError(id, name, reason, xhr) {
          // eslint-disable-next-line jquery-unsafe/no-html
          $('#data_file_issues').html(reason.escapeHTML())
          _this.displayErrors('data_file_errors')
        },
      },
    })
  }
}

window.CDD.DataFile = DataFile
