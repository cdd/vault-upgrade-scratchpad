if (typeof window.CDD === 'undefined') { window.CDD = {} }

let CDD = window.CDD
CDD.Mapper = {}

window.setupScrollbar = function (jumpTo) {
  var COLUMN_WIDTH = 150
  var PAGE_WIDTH = COLUMN_WIDTH * 4.5

  var container = $('#mapper-scrollbar'),
    track = $('#mapper-scrollbar-track'),
    background = $('#mapper-scrollbar-background')

  var columns = $('#mapper-columns'),
    columnsInner = $('#mapper-columns-inner'),
    MAX_SCROLL = columns[0].scrollWidth - columns.outerWidth()

  var leftButton = $('#mapper-pager-button-left'),
    rightButton = $('#mapper-pager-button-right')

  // keep scrollbar and pager buttons in sync
  function updatePagerButtons(newScrollLeft) {
    if (newScrollLeft === 0) {
      leftButton.addClass('disabled')
    } else {
      leftButton.removeClass('disabled')
    }

    if (newScrollLeft === MAX_SCROLL) {
      rightButton.addClass('disabled')
    } else {
      rightButton.removeClass('disabled')
    }
  }

  // scrollbar updated
  function scrollbarUpdate(_event, ui) {
    columns[0].scrollLeft = ui.value
    updatePagerButtons(ui.value)
  }

  // create $UI slider
  track.slider({
    max: MAX_SCROLL,
    slide: scrollbarUpdate,
    change: scrollbarUpdate,
  })

  var scrollColumns = track.slider.bind(track, 'value')
  var handle = track.find('.ui-slider-handle')

  // disable or enable slider
  if (columns[0].scrollWidth === columns[0].offsetWidth) {
    track.slider('disable')
    container.addClass('disabled').parent().addClass('noScroll')
  } else {
    track.slider('enable')
    container.removeClass('disabled').parent().removeClass('noScroll')
  }

  // scroll handle width
  if (columns[0].scrollWidth > columns.outerWidth()) {
    // handle width proportional to column overflow
    var handleSize = ((columns.outerWidth() / columnsInner.outerWidth()) * track.outerWidth(true))
    handle.css({
      width: handleSize + 'px',
      'margin-left': -handleSize / 2 + 'px',
    })
    track.css({
      margin: '0 ' + handleSize / 2 + 'px',
    })
  } else {
    handle.css({ width: '100%' })
  }

  // jump to value if appropriate
  if (typeof jumpTo === 'number') {
    track.slider('value', jumpTo)
    updatePagerButtons(jumpTo)
  } else {
    updatePagerButtons(0)
  }

  // set up pager buttons
  leftButton.off('click')
  leftButton.on('click', function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (!leftButton.hasClass('disabled')) {
      scrollColumns(columns[0].scrollLeft - PAGE_WIDTH)
    }
  })

  rightButton.off('click')
  rightButton.on('click', function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (!rightButton.hasClass('disabled')) {
      scrollColumns(columns[0].scrollLeft + PAGE_WIDTH)
    }
  })

  background.off('click')
  background.on('click', function (e) {
    e.stopPropagation()
    if (e.target.id !== 'mapper-scrollbar-background') { return }

    if (e.offsetX / background.width() > 0.5) {
      scrollColumns(MAX_SCROLL)
    } else {
      scrollColumns(0)
    }
  })

  CDD.Mapper.scrollColumns = scrollColumns
}

export function makeColumnVisible(column) {
  var columns = $('#mapper-columns')
  var columnLeft = column.position().left
  var padding = parseInt(columns.css('padding-left'), 10)

  // scrolled out of view
  if (columnLeft < padding || (columnLeft + column.width()) > columns.width()) {
    CDD.Mapper.scrollColumns(column[0].offsetLeft - column.width())
  }
}

export function enableMapper() {
  $('#mapper').removeClass('loading')
  // form enable/disable
  $('#mappingOptionsForm').find(':input').prop('disabled', false)
  // We call this too often.  It is called right before the loading screen
  // goes away (when it does not work) - so I call it here again.
  updateAllRunDetails()
}

function headerMappingOptionsDivs() {
  return $('#mapper-picker').find('div.drilldown-options-mapping')
}

function activeHeaderMappingOptionsDiv() {
  return headerMappingOptionsDivs().filter(':visible')
}

// Also used in Selenium
function activeHeaderMappingOptionsSubmitButton() {
  return activeHeaderMappingOptionsDiv().find('.buttony-submit:first')
}
window.activeHeaderMappingOptionsSubmitButton = activeHeaderMappingOptionsSubmitButton

function submitSavesData() {
  return activeHeaderMappingOptionsSubmitButton().text() === 'Apply'
}

export function disableMapper(base_message_on_form) {
  var status = 'Loading'
  if (base_message_on_form && submitSavesData()) { status = 'Saving' }
  // eslint-disable-next-line jquery-unsafe/no-html
  $('#drilldown-loading-status').html(status)
  $('#mapper').addClass('loading')
  $('#mappingOptionsForm').find(':input').prop('disabled', true)
  $('#mapper').find(':input').prop('disabled', true) // If the mapper is not yet active
}

// Used to disable the mapper while editing the slurp details (reg type, slurp type)
function inactiveMapper() {
  disableMapper()
  $('#mapper .activeColumn').removeClass('activeColumn')
  $('#mapper .selectableColumn').removeClass('selectableColumn')
}
window.CDD.Mapper.inactiveMapper = inactiveMapper

function activeHeaderMappingOptionsForm() {
  return activeHeaderMappingOptionsDiv().find('form:first').first()
}

function hasChangesToApply() {
  return activeHeaderMappingOptionsForm().hasClass('hasChangesToApply')
}

export function confirmLossOfUnappliedChanges() {
  return !hasChangesToApply() ||
         confirm('You have not applied your changes to the current field. Do you wish to continue, discarding your changes?')
}

function updateColumnSelection(column) {
  $('#mapper .activeColumn').removeClass('activeColumn').addClass('selectableColumn')
  column.removeClass('selectableColumn').removeClass('hover').addClass('activeColumn')
  makeColumnVisible(column)
}
window.updateColumnSelection = updateColumnSelection

export function columnSelected(column, edit_url) {
  if (column.hasClass('selectableColumn') && !$('#mapper').hasClass('loading')) {
    if (confirmLossOfUnappliedChanges()) {
      disableMapper(false)
      $.ajax(edit_url, {
        async: true,
        dataType: 'script',
        type: 'GET',
        complete: function () {
          enableMapper()
          window.CDD.Form.setupNewForms()
        },
      })

      updateColumnSelection(column)
    }
  }
}

// eslint-disable-next-line no-unused-vars
window.addColumn = function (column, edit_url) {
  $('#addAColumn-dialog').hide()

  var container = $('#mapper-columns-inner')
  container.width(container.width() + 150)
  column.show()
  setupScrollbar(0)
  columnSelected(column, edit_url)
}

// eslint-disable-next-line no-unused-vars
window.removeColumn = function (column, replacement_column, replacement_edit_url) {
  column.stop().fadeOut().queue(function () {
    var container = $('#mapper-columns-inner')
    container.width(container.width() - 150)
    setupScrollbar(0)
    if ($(column).hasClass('activeColumn')) {
      columnSelected(replacement_column, replacement_edit_url)
    }
  })
}

// Header mapping options functions
export function headerMappingModified(disable) {
  activeHeaderMappingOptionsSubmitButton().text('Apply')

  var activeForm = activeHeaderMappingOptionsForm()
  activeForm.addClass('hasChangesToApply')
  if (activeForm.length > 0) {
    if (disable) {
      // need to get the plugin working
      activeForm[0].disableSubmit()
    } else {
      activeForm[0].enableSubmit()
    }
  }
}

export function protocolSelectionChanged(data, after) {
  if (data === undefined) {
    data = {}
  }
  data.protocol_id = $('#protocols').val()
  $.ajax($('#protocols').data('updateUrl'), {
    async: true,
    dataType: 'script',
    type: 'GET',
    data: data,
  }).done(() => {
    headerMappingModified(true)
    after && after()
  })
}

function selectedRun() {
  var visible_run_select = $('#run_selection select:visible')
  return visible_run_select.length > 0 ? visible_run_select.val() : ''
}

export function updateRunIdHiddenFieldValue() {
  var runId = selectedRun()
  $('#header_mapping_run_id').val(runId)
  headerMappingModified(runId === '')
}

function updateRunDetails(element, value) {
  $('#' + element + ' td').text(value)
  if (value !== '') {
    $('#' + element).show()
  } else {
    $('#' + element).hide()
  }
}

function updateAllRunDetails() {
  var run = selectedRun()
  if (run === '') {
    $('#selected_run_place, #selected_run_conditions').hide()
  } else {
    var runDetails = $('#run_selection').data('runDetailsByRunId')
    if (runDetails) {
      updateRunDetails('selected_run_place', runDetails[run][0] || '')
      updateRunDetails('selected_run_conditions', runDetails[run][1] || '')
    }
  }
}

// when the user chooses a run in one of the droplists, choose it if available in the others
function synchronizeRunSelects() {
  var run = selectedRun()
  $('#run_selection .runs_for_readout_definition option').each(function (_index, element) {
    if (element.value === run) {
      element.selected = true
    } else {
      element.selected = false
    }
  })
}

export function runSelectionChanged() {
  updateRunIdHiddenFieldValue()
  updateAllRunDetails()
  synchronizeRunSelects()
}

// Create new run functions
CDD.Mapper.createRunDialog = (function () {
  var sortSelect = function (select) {
    var options = $(select).children('option').toArray()
    select.appendChild(options.shift())
    _.sortBy(options, function (o) { return o.innerHTML }).reverse().forEach(function (option) { select.appendChild(option) })
  }

  var newOption = function (runId, runIdentifier, selected) {
    var selectedString = selected ? 'selected' : ''
    var option = $('<option value=\'' + runId + '\' ' + selectedString + '></option>')
    return option.html(runIdentifier)
  }

  return function (runId, runIdentifier, runGrouping, protocolId) {
    if (runGrouping && protocolId) {
      var targetSelect = $('#run_grouping_assignments_' + runGrouping)
      targetSelect.find('option').each(function (_index, option) {
        option.selected = false
      })
      $('.run_grouping_assignments_for_protocol_' + protocolId).each(function () {
        var protocolSelect = this
        // eslint-disable-next-line jquery-unsafe/no-append
        $(protocolSelect).append(newOption(runId, runIdentifier, protocolSelect === targetSelect[0]))
        sortSelect(protocolSelect)
      })
      targetSelect.trigger('change')
      $('#createRun-dialog').dialog('close')
    } else {
      protocolSelectionChanged({
        readout_definition_id: $('#header_mapping_readout_definition_id').val(),
        run_id: runId,
      }, function () {
        $('#createRun-dialog').dialog('close')
        runSelectionChanged()
      })
    }
  }
})()

// Maping template wizard functions

// eslint-disable-next-line no-unused-vars
window.showMappingTemplateWizard = function (step) {
  // TODO: Make the show mapping template wizard an action and rerender the whole page since we are doing so much here
  if (!confirmLossOfUnappliedChanges()) { return false }

  $('#mappingTemplateWizardLink').hide()
  $('#mappingTemplateWizardApplied').hide()
  $('#mapper-picker').hide()
  $('#mapper .activeColumn').removeClass('activeColumn')

  $('#mappingWarnings').hide()
  if ($('.slurp-edit-form')[0]) {
    $('.slurp-edit-form')[0].disableSubmit()
  }
  disableMapper()

  if (step == 1) {
    $('#mappingTemplateWizard-step1').show()
    $('#mappingTemplateWizard-step2').hide()
  } else {
    $('#mappingTemplateWizard-step1').hide()
    $('#mappingTemplateWizard-step2').show()
  }
  $('#mappingTemplateWizard').show()
  $('#mappingTemplateWizard').effect('highlight')
}

export function updateMappingSummariesForHeaders(select, header_ids) {
  var option = select.find('option:selected')
  var runDate
  if (option.val() !== '') {
    runDate = $(option).text()
  }

  header_ids.forEach(function (header_id) {
    $('#mapped_run_header_' + header_id).text(runDate || '')
    if (runDate) {
      $('#column_header_' + header_id).addClass('mappedColumn').removeClass('partiallyMappedColumn')
    } else {
      $('#column_header_' + header_id).removeClass('mappedColumn').addClass('partiallyMappedColumn')
    }
  })
}

export function headerMappingTypeSelected(link, options_div_id) {
  $('#mapper-picker a.drilldown-item.active').removeClass('active')
  $(link).addClass('active')

  headerMappingOptionsDivs().hide()
  $('#' + options_div_id).show()
}

function selectedReadoutDefinition() {
  return $('#header_mapping_readout_definition_id').val() || $('#header_mapping_readout_definition_id').find(':selected').val() || ''
}

function updateRunSelection() {
  var readout = selectedReadoutDefinition()

  // we look at which select is visible to determine the selected run, so we need to hide them all if they select no run
  $('#run_selection .runs_for_readout_definition, #run_selection .run-selection-dropdown').each(function () {
    var element = $(this)
    if (element.attr('id') === ('runs_for_readout_definition_' + readout)) {
      element.show()
    } else {
      element.hide()
    }
  })

  if (readout === '') {
    $('#run_selection').hide()
  } else {
    $('#run_selection').show()
  }
  updateAllRunDetails()
}
window.updateRunSelection = updateRunSelection

export function readoutDefinitionSelectionChanged() {
  updateRunSelection()
  updateRunIdHiddenFieldValue()
}

// Registration system mapping options

function mappingOptionsChanged(element) {
  element.form.submit()
  disableMapper()
}

// private!

CDD.setFileHistoryVisibility = function (file_id) {
  $('.file_' + file_id + '_row').toggle()
}

$(function () {
  $(document).on('click', '#mapper-registrationType .input-radio', function () {
    mappingOptionsChanged(this)
  })

  $(document).on('change', '.slurp-type-select', function () {
    $('#mappingOptionsRegister').val(this.value)
    mappingOptionsChanged(this)
  })

  $(document).on('keyup', '.prefix-option', function () {
    headerMappingModified(false)
  })

  $(document).on('click', '.used-as-molecule', function () {
    headerMappingModified(false)
  })

  $(document).on('change', '#molecule_fields', function () {
    headerMappingModified(false)
  })

  $(document).on('change', '.run-selection-dropdown', function () {
    runSelectionChanged()
  })

  $(document).on('change', '#header_mapping_readout_definition_id', function () {
    readoutDefinitionSelectionChanged()
  })

  $(document).on('change', '#protocols', function () {
    protocolSelectionChanged()
  })

  $(document).on('click', '.selectableColumn:not(#newColumnLink)', function () {
    var that = $(this)
    columnSelected(that, that.data('editPath'))
  })

  $(document).on('ajax:before', 'form.drilldown-options-form', function () {
    disableMapper.call(this, true)
  }).on('ajax:complete', function () {
    enableMapper.call(this)
  })

  $(document).on('submit', '.slurp-edit-form', document, function () {
    if (!confirmLossOfUnappliedChanges()) {
      $(this).enableSubmit()
      return false
    }
  })

  $(document).on('change', '.run-grouping-assignments', function () {
    updateMappingSummariesForHeaders($(this), $(this).data('headerIds'))
  })

  $(document).on('ajax:beforeSend', '.drilldown-options-mapping form', function (_event, jqXHR) {
    jqXHR.done(enableMapper)
    disableMapper(true)
  })

  $(document).on('click', '.drilldown-item:not(.active)', function () {
    headerMappingTypeSelected(this, this.dataset.id)
  })
})
