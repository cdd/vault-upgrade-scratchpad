import './jquery.js'
import CDDAxios from './axios.js'
import activeAjax from './activeAjax.js'
import globalErrorReporter from './error_reporter.js'

import calendarIcon from '../images/cdd30/icons/calendar.png'

import promiseFinally from 'promise.prototype.finally'

promiseFinally.shim()

if (window.CDD === undefined) {
  window.CDD = {}
}

let CDD = window.CDD

$(() => {
  $(document).ajaxStart(activeAjax.start)
  $(document).ajaxStop(activeAjax.stop)

  CDDAxios.initialize()
  window.addEventListener('error', globalErrorReporter)
})

CDD.Form = (function () {
  var makeFormDisableable = function (form) {
    form.disableSubmit = function () {
      $(form).data('disabled', true)
      $(form).find('.buttony-submit').addClass('disabled')
    }

    form.enableSubmit = function () {
      $(form).data('disabled', false)
      $(form).find('.buttony-submit').removeClass('disabled')
    }

    if ($(form).data('initiallyDisabled') && !$(form).data('setup')) {
      form.disableSubmit()
      $(form).data('setup', true)
    }
  }

  var displayMessageIfNotAlreadyAssociated = function (ignored, projectSelect) {
    var sharingWarningID = projectSelect.id + '-sharingWarning'
    var sharingWarning = $('#' + sharingWarningID)
    var associatedProjectIds = $(projectSelect).attr('data-sharing-except_project_ids').split(',')

    if (sharingWarning.length === 0) {
      sharingWarning = $('<span>').addClass('warning').text($(projectSelect).data('sharingWarning')).css('padding', '0 0 0 10px').attr('id', sharingWarningID)
      sharingWarning.insertAfter(projectSelect)
    }

    if (projectSelect.value === '' || _.includes(associatedProjectIds, projectSelect.value)) {
      sharingWarning.hide()
    } else {
      sharingWarning.show()
    }
  }

  var setupNewForms = function () {
    $('form').toArray().forEach(makeFormDisableable)
    $('select[data-sharing-warning]').each(function (index, projectSelect) {
      displayMessageIfNotAlreadyAssociated(null, projectSelect)
    })
  }

  $(function () {
    CDD.Form.setupNewForms()
    $(document).ajaxComplete(CDD.Form.setupNewForms)

    $(document).on('change', 'select[required]', function () {
      if ($(this).val().trim() === '') {
        $(this).closest('form')[0].disableSubmit()
      } else {
        $(this).closest('form')[0].enableSubmit()
      }
    })

    $(document).on('change', 'select[data-sharing-warning]', function (event) {
      displayMessageIfNotAlreadyAssociated(null, event.currentTarget)
    })
  })

  return {
    setupNewForms: setupNewForms,
    makeFormDisableable: makeFormDisableable,
  }
})()

export function clearForm(form) {
  form.find(':text, textarea').val(null)
  form.find(':checkbox, :radio').prop('checked', false)
  form.focusFirst()
  if (form.length > 0) {
    CDD.Form.makeFormDisableable(form[0])
    form[0].enableSubmit()
  }
}

export function updateAllCheckboxes(element, check) {
  $(element).find(':checkbox').prop('checked', check)
}

function uncheckSpecificCheckbox(box) {
  // when selecting which collaborator, we use this function to uncheck the share with public, which can not be there if the vault doesn't share publicly
  box.prop('checked', false)
}

function uncheckAllButSpecificCheckbox(box) {
  var checked = box.prop('checked')
  updateAllCheckboxes(box.closest('form')[0], false)
  box.prop('checked', checked)
}

// function toggleCollapsible(blockId, focusInputId) {
//   var block = $('#' + blockId)
//   if (!block.hasClass('disabled')) {
//     block.toggleClass('collapsible-open').toggleClass('collapsible-closed')
//     if (focusInputId != null && block.hasClass('collapsible-open')) {
//       $('#' + focusInputId).focus()
//     }
//   }
// }

CDD.storeElementInitialState = function (element) {
  // We consider the element is in its initial state
  // Save the HTML to perform the reset next time this is called
  element.__initialInnerHTML__ = element.innerHTML
}

CDD.resetElementToInitialState = function (element) {
  if (typeof element === 'undefined') { return }

  if (element.__initialInnerHTML__ !== undefined) {
    // Reset the HTML to what we saved
    $(element).html(element.__initialInnerHTML__) // eslint-disable-line jquery-unsafe/no-html
    CDD.Form.setupNewForms()
  } else {
    CDD.storeElementInitialState(element)
  }
}

// showEditPanel and showDialog ensure that the panel's or dialog's form is reset
window.showEditPanel = function (domIdBase, formId) {
  var editPanel = $('#' + domIdBase + '-edit')

  if (formId) {
    CDD.resetElementToInitialState(editPanel[0])
  } // no form => no need to reset
  $('#' + domIdBase + '-show').hide()
  $('#' + domIdBase + '-drag').hide()
  editPanel.show()
  if (formId === true) {
    editPanel.focusFirst()
  } else {
    $('#' + formId).focusFirst()
  }
}

window.hideEditPanel = function (domIdBase) {
  $('#' + domIdBase + '-edit').hide()
  $('#' + domIdBase + '-show').show()
  $('#' + domIdBase + '-drag').show()
}

window.showDialog = function (dialogId, formId) {
  var dialog = $('#' + dialogId)
  showDialogOfElement(dialog)
}

window.showDialogOfElement = function (element) {
  element.find('.hasDatepicker').datepicker('destroy')
  CDD.resetElementToInitialState(element[0])
  CDD.setupCalendarFields()
  element.show()
  element.focusFirst()
}

window.insertGlobalMessage = function (message) {
  if ($('#globalMessages').length === 0) {
    $('<div></div>').attr('id', 'globalMessages').prependTo('#content-inner') // eslint-disable-line jquery-unsafe/no-prependTo
  }

  var parsedMessage = $('<div></div>').html(message).children().first() // eslint-disable-line jquery-unsafe/no-html
  if ($('#' + parsedMessage.attr('id') + ':visible').length > 0) {
    $('#' + parsedMessage.attr('id')).replaceWith(message)
  } else {
    $('#globalMessages').prepend(message) // eslint-disable-line jquery-unsafe/no-prepend
  }
}

function removeGlobalMessage(domId) {
  if ($('#globalMessages').length > 0) {
    $('#' + domId).remove()
    if ($('#globalMessages .globalMessage').length === 0) {
      $('#globalMessages').remove()
    }
  }
}
window.removeGlobalMessage = removeGlobalMessage

CDD.Export = {
  setElnDisableTo: function () {},

  submit: function (export_path, exportProgressPath = '', additionalParams = {}) {
    CDD.Export.disable()
    window.scrollTo(0, 0)
    $.ajax(export_path, {
      async: true,
      dataType: 'script',
      data: additionalParams,
      method: 'GET',
    }).done(() => {
      Pollers.start('export', exportProgressPath, 2)
    })
  },

  disable: function () {
    $('.export_link').hide()
    $('.disabled_export_link').show()
    window.CDD.Export.setElnDisableTo(true)

    $('.export_form').each(function (index, element) {
      if (element.disableSubmit !== undefined) {
        element.disableSubmit()
      }
    })

    $('#exportOptions-dialog').hide()
  },

  enable: function () {
    removeGlobalMessage('export_progress_message')
    $('.export_link').show()
    $('.disabled_export_link').hide()
    window.CDD.Export.setElnDisableTo(false)
    if ($('#export_options_form').length > 0) {
      $('#export_options_form')[0].enableSubmit()
    }
  },

  downloadClicked: function () {
    $('#export_progress_message a.download').data('disabled', true)
    $('#export_progress_message').fadeOut()
    window.CDD.Export.enable()
    return true
  },
}

export function addAssociatedModel() {
  var associatedModel = $(this).closest('.associated-model')
  var newId = new Date().getTime()
  var template = associatedModel.find('script:first-child').text()
  var templateWithNewId = template.replace(/NEW_RECORD/g, newId)
  associatedModel.before(templateWithNewId)
  return newId
}

$(function () {
  $(document).on('click', '.associated-model .add-associated-model', addAssociatedModel)
  $(document).on('click', '#add_collection_term_link', function () {
    $('#collections .collection_criterion:visible .criterion_junction:first').hide()
  })
  $(document).on('click', '.add-members-link', function () {
    window.CDD.Projects.updateUserSelects($(this).closest('form'))
  })
})

window.updateTitleAndPageHeader = function (name, nameForTitle) {
  if (typeof nameForTitle == 'undefined') {
    nameForTitle = name
  }

  document.title = nameForTitle.unescapeHTML() + ' - Collaborative Drug Discovery'
  $('#pageHeader').find('h1 .title').text(name.unescapeHTML())
}

function updateTabItemCount(tab, count) { // eslint-disable-line no-unused-vars
  $('#' + tab + 'Link').find('.count').html(count) // eslint-disable-line jquery-unsafe/no-html
}

window.openMiniApp = function (url, windowName, windowOptions) {
  if (typeof (windowOptions) === 'undefined') {
    windowOptions = 'resizable,scrollbars,width=800,height=600'
  }
  var miniApp = window.open(url, windowName, windowOptions)
  miniApp.__isChildWindow = true
  miniApp.focus()
  return miniApp
}

window.normalizePath = function (path) {
  if (path === null) {
    return null
  }

  var parts = path.split('/')

  if (_.every(parts, function (part) { return part.trim().length === 0 })) {
    return '/'
  } else if (_.last(parts).trim().length === 0) {
    parts.pop() // remove trailing slash
  }

  return parts.map(
    function (element) {
      // !isNaN is a nice substitute for writing our own isNumber
      return (element.trim().length === 0 || isNaN(element)) ? element : 'N'
    }
  ).join('/')
}

export function normalizeUrl(url) {
  if (url === null || url.trim().length === 0) {
    return normalizePath(url)
  }

  // remove query string, then split the first part
  var parts = _.first(url.split('?')).split('/')

  if (_.includes(['http:', 'https:'], _.first(parts))) {
    return normalizePath('/' + parts.slice(3).join('/'))
  } else {
    return normalizePath(url) // maybe already a path
  }
}

window.Pollers = {
  active: {},

  start: function (name, path, frequency, onSuccessCallback) {
    // We use the poller_request flag defensively to ensure we only use pollers with progress controllers
    var appended_path = path + (path.indexOf('?') > -1 ? '&' : '?') + 'poller_request=true'
    this.stop(name)

    var request = function () {
      return $.ajax(appended_path, {
        async: true,
        method: 'GET',
        success: onSuccessCallback,
        global: false,
      })
    }

    this.active[name] = new PeriodicalExecuter(request, frequency)
  },

  stop: function (name) {
    if (this.active[name]) {
      this.active[name].stop()
      delete this.active[name]
    }
  },
}

CDD.Slurp = {
  updateGenericPage: function (slurpStatus) {
    Pollers.stop('slurp-progresses')
  },

  updateQCReportPage: function (slurpStatus) {
    if (_.includes(['processed', 'committed', 'canceled', 'rejected', 'invalid'], slurpStatus)) {
      Pollers.stop('slurp-progress')
      removeGlobalMessage('qcReportSlurpIndicator')
      window.location.reload(true)
    }
  },

  // we redefine functions as needed, so client code can always call updatePage
  updatePage: function (slurpStatus) {
    CDD.Slurp.updateGenericPage(slurpStatus)
  },
}

CDD.setupAsynchronousContentLoading = function (elementsToObserve, urlTemplate) {
  var loadAsynchronousContentIfNecessary = function () {
    var loadingElement = $(this).closest('div').find('.asyncLoading')
    if (loadingElement.length > 0 && !loadingElement.hasClass('requested')) {
      var url = urlTemplate
      _.keys(loadingElement.data()).forEach(function (key) {
        url = url.replace(key.toUpperCase(), loadingElement.data()[key])
      })
      loadingElement.addClass('requested') // Craxy clickers damage control
      $.ajax(url, {
        async: true,
        dataType: 'script',
        method: 'GET',
      })
    }
  }

  $(function () {
    setTimeout(function () {
      $(document).on('click', elementsToObserve, loadAsynchronousContentIfNecessary)
      $(elementsToObserve).filter('.collapsible-open').each(function (activityBlock) {
        loadAsynchronousContentIfNecessary.call(activityBlock)
      })
    }, 1)
  })
}

String.prototype.titleize = function () {
  return this.split(' ').map(function (term) { return _.capitalize(term) }).join(' ')
}

String.prototype.stripTags = function () {
  return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '') // eslint-disable-line security/detect-unsafe-regex
}

String.prototype.unescapeHTML = function () {
  return this.stripTags().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

String.prototype.escapeHTML = function () {
  return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function validateDataFileSelection(fileInputElement, errorElement) {
  var extension = fileInputElement.val().split('.').pop().toLowerCase()
  if (!_.some(['csv', 'sdf', 'xlsx', 'gz', 'gzip', 'zip'], function (e) { return extension == e })) {
    errorElement.fadeIn()
    fileInputElement.val('')
  } else {
    errorElement.fadeOut()
  }
}

// Deserialization
// Improved and modified from original version available at http://madchicken.altervista.org/js/deserialize.js

CDD.Form.deserialize = function (form, data) {
  var Deserializers = {
    input: function (element, data) {
      switch (element.type.toLowerCase()) {
        case 'submit':
        case 'hidden':
        case 'password':
        case 'text':
          return Deserializers.textarea(element, data)
        case 'checkbox':
          return Deserializers.inputSelector(element, data)
        case 'radio':
          return Deserializers.radioSelector(element, data)
      }
      return false
    },

    inputSelector: function (element, data) {
      var name = element.name
      var checkboxs = $(element.form).find('input:checkbox[name=\'' + name + '\']')
      for (var i = 0, len = checkboxs.length; i < len; i++) {
        checkboxs[i].checked = true
      }
    },

    radioSelector: function (element, data) {
      var name = element.name
      var radiobuttons = $(element.form).find('input:radio[name=\'' + name + '\']')
      for (var i = 0, len = radiobuttons.length; i < len; i++) {
        var radiobutton = radiobuttons[i]
        if (radiobutton.value === data) { radiobutton.checked = true }
      }
    },

    textarea: function (element, data) {
      element.value = data
    },

    select: function (element, data) {
      return Deserializers[element.type === 'select-one' ? 'selectOne' : 'selectMany'](element, data)
    },

    selectOne: function (element, data) {
      element.value = data
    },

    selectMany: function (element, data) {
      var i = 0, k = 0, len, op
      if (data instanceof Array) {
        for (len = data.length; k < len; k++) {
          for (len = element.options.length; i < len; i++) {
            op = element.options[i]
            if (op.value === decodeURIComponent(data[k])) {
              op.selected = true
              break
            }
          }
        }
      } else {
        for (i = 0, len = element.options.length; i < len; i++) {
          op = element.options[i]
          if (op.value === decodeURIComponent(data)) {
            op.selected = true
            break
          }
        }
      }
    },
  }

  clearForm(form)
  var formElements = form.find(':input'),
    processedData = {}, targetElements = [],
    method, element, elementIndex

  data.forEach(function (dataElement) {
    if (processedData[dataElement.name] === undefined) { processedData[dataElement.name] = [] }
    processedData[dataElement.name].push(dataElement.value)

    targetElements = formElements.toArray().filter(function (element) {
      return $(element).attr('name') === dataElement.name
    })

    elementIndex = processedData[dataElement.name].length - 1 // For parameter arrays, we will have more than one form element with the same name
    element = targetElements[elementIndex]
    method = element.tagName.toLowerCase()
    Deserializers[method](element, dataElement.value)
  })
}

CDD.History = {
  formData: function () {
    if (document.location.href.search(/\?uuid=/) === -1) { return null }

    const state = window.history.state

    return state && state.data && state.data.formInnerHTML
      ? state.data
      : null
  },

  persistFormState: function (form) {
    var generateUUID = function () {
      return String(new Date().getTime()) + '_' + String(Math.floor((Math.random() * 100000) + 1))
    }

    const otherFormData = form.find('[data-form-data]').data('form-data')
    const data = {
      data: Object.assign({
        formData: form.serializeArray(),
        formInnerHTML: form.not('.no-persist-html').html(),
      }, otherFormData),
    }

    window.history.replaceState(data, '', '?uuid=' + generateUUID())
  },

  restoreFormStateEvent: 'restoreFormState',

  restoreFormState: function (form) {
    const data = this.formData()
    if (data) {
      form.html(data.formInnerHTML)
      CDD.Form.deserialize(form, data.formData)
      form[0].dispatchEvent(
        new CustomEvent(this.restoreFormStateEvent, { detail: data })
      )
    }
  },

  persistSelectionState: function (exceptMoleculeIds) {
    const handler = this.restoreHandlerState()
    window.history.pushState({
      data: {
        unselectedRows: exceptMoleculeIds,
        selectionHandler: handler,
      },
    }, '', '?selections=' + exceptMoleculeIds)
  },

  persistHandlerState: function (selectionHandler) {
    window.history.pushState({
      data: {
        selectionHandler: selectionHandler,
      },
    }, '', '?selections=' + selectionHandler)
  },

  restoreSelectionState: function (toggleAll) {
    var state = window.history.state
    if (state && state.data && state.data.unselectedRows && !toggleAll) {
      return state.data.unselectedRows
    } else {
      return []
    }
  },

  restoreHandlerState: function () {
    var state = window.history.state
    if (state && state.data && state.data.selectionHandler) {
      return state.data.selectionHandler
    }
  },
}

CDD.disable = function (element) {
  if (!element.hasClass('disabled')) {
    element.addClass('disabled')
    element.off('click', element.data('onClickHandler'))
  }
}

CDD.enable = function (element) {
  if (element.hasClass('disabled')) {
    element.removeClass('disabled')
    element.on('click', element.data('onClickHandler'))
  }
}

CDD.makeDisableable = function (element, onClickHandler, initiallyEnabled) {
  if (element.length === 0) {
    return
  }
  element.data('onClickHandler', onClickHandler)
  if (initiallyEnabled === true) {
    element.on('click', onClickHandler)
  } else if (initiallyEnabled === false) {
    CDD.disable(element)
  }
}

// Project resources associations: tested with selenium

CDD.AccessManager = function (removeLinkHTML) {
  this.removeLinkHTML = removeLinkHTML
}

CDD.AccessManager.prototype.addProject = function () {
  if (this.getSelectedOption().val() === '') {
    return
  }

  $('#deleteWarning').hide()
  var project = {
    id: this.getSelectElement().val(),
    name: this.getSelectedOption().text(),
  }
  var hiddenInput = $('<input>').attr({ type: 'hidden', name: 'project_ids[]' }).val(project.id)
  var newProjectCell = $('<td>').text(project.name).append(hiddenInput) // eslint-disable-line jquery-unsafe/no-append
  var newActionCell = $('<td>').addClass('actions').html(this.removeLinkHTML) // eslint-disable-line jquery-unsafe/no-html
  this.addProjectDataToLink(newActionCell.find('a'), project)
  var newRow = $('<tr>').append(newProjectCell).append(newActionCell) // eslint-disable-line jquery-unsafe/no-append

  $('#addProjectRow').before(newRow) // eslint-disable-line jquery-unsafe/no-before
  this.getSelectedOption().remove()
  this.synchAdditionState()
}

CDD.AccessManager.prototype.removeProject = function (linkElement) {
  linkElement = $(linkElement)
  var project = {
    id: linkElement.data('projectId'),
    name: linkElement.data('projectName').toString(), // Numerical names will be extracted as an int and cause errors
  }

  var newOption = this.buildProjectOption(project)
  if (this.getSelectElement()) {
    var succeedingOption = this.getSelectElement().find('option').filter(function (index, element) {
      return (element.value !== '') && (element.text.toLowerCase() > project.name.toLowerCase())
    }).first()

    if (succeedingOption.length === 0) {
      this.getSelectElement().append(newOption)
    } else {
      succeedingOption.before(newOption)
    }
  }

  this.synchAdditionState()
  var parentTable = $('#projects')
  linkElement.closest('tr').remove()
  if ((this.getSelectElement().length > 0 && parentTable.children().length === 1) || parentTable.children().length === 0) {
    $('#deleteWarning').show()
  }
}

CDD.AccessManager.prototype.synchAdditionState = function () {
  if (this.getSelectElement().length === 0) {
    return
  }
  // Taking into account a placeholder option
  if (this.getSelectElement().find('option').length <= 1) {
    this.getSelectElement().hide()
    $('#noMoreProjectsMessage').show()
  } else {
    $('#noMoreProjectsMessage').hide()
    this.getSelectElement().show()
  }
}

CDD.AccessManager.prototype.setUpForm = function () {
  this.getSelectElement().on('change', function () {
    this.addProject()
  }.bind(this))
  this.synchAdditionState()
}

CDD.AccessManager.prototype.getSelectElement = function () {
  return $('#newProjectDroplist')
}

CDD.AccessManager.prototype.getSelectedOption = function () {
  return this.getSelectElement().find('option:selected')
}

CDD.AccessManager.prototype.buildProjectOption = function (project) {
  return new Option(project.name, project.id)
}

CDD.AccessManager.prototype.addProjectDataToLink = function (linkElement, project) {
  linkElement.data({
    projectId: project.id,
    projectName: project.name,
  })
  // just for selenium
  linkElement.attr('data-project-id', project.id)
}

CDD.deleteResourceClicked = function (resourceName) {
  window.showContainerTab('resource-projects', _.map($('#content').find('.container-tab'), _.property('id')))
  $('#deleteInstructions-' + resourceName).show()
  $('#resource-projects-container .edit_project_associations_link').each(function (index, link) {
    link.innerHTML = link.innerHTML.replace('Add or remove access', 'Remove access') // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml
  })
}

function toggleParameterConstraint() {
  var upperValueTextField = $(this).closest('tr').find('.upper-value')
  var lowerValueTextField = $(this).closest('tr').find('.lower-value')
  var defaultValueTextField = $(this).closest('tr').find('.default-value')
  var selectedUnit = $(this).find('option:selected').html()

  // Forcing the upperValueTextField to render inline while still being hidden
  // would allow us to use Effects here, but since it is not rendering inline
  // we do this so there isn't a wierd two lines => one line transition
  if (selectedUnit === 'default') {
    upperValueTextField.hide()
    lowerValueTextField.hide()
    defaultValueTextField.show()
  } else if (selectedUnit === 'best fit') {
    upperValueTextField.hide()
    lowerValueTextField.hide()
    defaultValueTextField.show()
  } else if (selectedUnit === 'from') {
    upperValueTextField.show()
    lowerValueTextField.show()
    defaultValueTextField.hide()
  } else {
    upperValueTextField.hide()
    lowerValueTextField.show()
    defaultValueTextField.hide()
  }
}

window.retoggleParameterConstraints = function (ids, parameters) {
  _.each(ids, function (id) {
    _.each(parameters, function (param) {
      $('#dose_response_plot_' + id + '_' + param + '_fit_type').trigger('change')
    })
  })
}

CDD.ModalOverlay = {
  show: function () {
    $('#modal-overlay').show()
    $(document.body).addClass('modal-open')
    $('#modal-dialog').show()
  },

  hide: function () {
    $('#modal-dialog').hide()
    $(document.body).removeClass('modal-open')
    $('#modal-overlay').hide()
  },
}

CDD.Messages = {
  setupNotificationSectionUpdate: function (url) {
    var projectSelect = $('#message_project_id')
    var updateNotificationSection = function () {
      if (projectSelect.val() === '') {
        $('#notifications').fadeOut()
      } else {
        $.ajax(url, {
          async: true,
          dataType: 'script',
          data: {
            project_id: projectSelect.val(),
          },
        })
      }
    }

    projectSelect.on('change', updateNotificationSection)
  },
}

CDD.setupCalendarFields = function () {
  $('[data-datepicker-format]').not('.hasDatepicker').each(function (index, dateSelect) {
    $(dateSelect).datepicker({
      // initialize with the format used by the server
      dateFormat: 'yy-mm-dd',
      showOn: 'button',
      buttonImage: calendarIcon,
      buttonImageOnly: true,
      showOtherMonths: true,
      selectOtherMonths: true,
      changeYear: true,
    }).datepicker('option', 'dateFormat', $(dateSelect).data('datepickerFormat'))
  })
}

$(CDD.setupCalendarFields)

$(document).on('click', '.registration-system-edit', function () {
  showEditPanel('registrationSystem', 'registrationSystem-edit-form')
  return false
})

$(document).on('click', '#newColumnLink', function () {
  showDialog('addAColumn-dialog', 'virtualHeaderForm')
  return false
})

$(document).on('click', '#registrationSystem-edit .cancel', function () {
  hideEditPanel('registrationSystem')
  return false
})

$(document).on('click', '#sortable_batch_field_definitions .orcancel .cancel', function () {
  hideEditPanel('batchFieldDefinitions')
})

$(document).on('change', '.dose-response-fit-type select', function () {
  toggleParameterConstraint.call(this)
})

$(document).on('change', "#newUpload-file input[type='file']", function () {
  $('#data_file_errors').fadeOut()
  $('#data_file_unparseable').fadeOut()
  $('#data_file_too_large').fadeOut()
  validateDataFileSelection($(this), $('#data_file_invalid_extension'))
})

$(document).on('change', "[name='snapshot[collaboration_ids][]']", function () {
  uncheckSpecificCheckbox($('#snapshot_share_with_entire_community'))
})

$(document).on('change', '#snapshot_share_with_entire_community', function () {
  uncheckAllButSpecificCheckbox($(this))
})

$(document).on('click', '.flag-readout', function () {
  $(this).closest('.flaggable').toggleClass('flagged')
  $(this).nextAll('input').each(function (index, element) {
    var currentValue = $(element).val()
    $(element).val((currentValue == '0' || currentValue == 'false') ? '1' : '0')
  })
})

$(document).on('ajax:success', '#shareDialog-message', function (xhr, data) {
  window.CDD.ShareDialog.afterMessageSubmission(data)
})

// Toggle user options dropdown in the header
$(document).on('click', function (e) {
  if ($('.user-dropdown').has(e.target).length === 0) {
    $('.user-dropdown').hide()
    $('.username-tab a').removeClass('selected')
  }
})

$(document).on('click', '.username-tab a', function (e) {
  if ($('.user-dropdown').is(':visible')) {
    $('.user-dropdown').hide()
    $('.username-tab a').removeClass('selected')
  } else {
    $('.user-dropdown').show()
    $('.username-tab a').addClass('selected')
  }
  return false
})

$(document).on('click', '.user-dropdown', function (e) {
  $('.user-dropdown').hide()
  $('.username-tab a').removeClass('selected')
})
