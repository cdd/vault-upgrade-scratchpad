import './application_global.js'
import { Terminology } from 'javascripts/cross_app_utilities.js'
import { insertGlobalError } from 'javascripts/application_global'
import { MixtureEditor } from '@/Molecule/MixtureEditor'

// A temporary home for event handlers that used to be attached inline by element attributes.

function fixCollectionCriteriaJunctions() {
  $('#collections .collection_criterion:visible .criterion_junction:first').hide()
}

window.fixCollectionCriteriaJunctions = fixCollectionCriteriaJunctions

$(document).on('submit', '#mine_search_form, .existing_file_selector', function () {
  return true
})

export function registerGlobalEventHandlers() {
  $(document).on('click', "a[href='#']", function (event) {
    event.preventDefault()
  })

  $('#modal-dialog').resizable({
    resize: function (event, ui) {
      if (ui !== undefined) {
        ui.size.width = ui.size.width + (ui.size.width - ui.originalSize.width)
        ui.size.height = ui.size.height + (ui.size.height - ui.originalSize.height)
      }
    },
  })

  $(document).on('click', '.disabled', function (event) {
    event.preventDefault()
    event.stopImmediatePropagation()
    return false
  })

  $(document).on('click', '.custom-calculation-form .orcancel .cancel', function () {
    $(this).closest('.custom-calculation-form').remove()
    $('#sortable_readout_definitions').show()
  })

  $(document).on('click', '#dose-response-calculation-new .orcancel .cancel', function () {
    $('#dose-response-calculation-new').remove()
    $('#sortable_readout_definitions').show()
  })

  $(document).on('click', '#dose-response-calculation-edit .orcancel .cancel', function () {
    $('#dose-response-calculation-edit').remove()
    $('#sortable_readout_definitions').show()
  })

  $(document).on('click', '.readout-definition-form .orcancel .cancel', function () {
    $('.readout-definition-form').closest('div.edit-panel').remove()
    $('#sortable_readout_definitions').show()
  })

  $(document).on('click', '.close-window', function () {
    window.close()
  })

  $(document).on('click', '.close-popup', function () {
    var popup = $(this).closest('.popup')
    popup.find('.hasDatepicker').datepicker('hide')
    popup.hide()
  })

  $(document).on('click', '.light-box-close', function () {
    var lightBox = $(this).closest('.light-box')
    lightBox.hide()
  })

  $(document).on('click', '.editableData-editLink-save .hide-edit-panel, .editableData .hide-edit-panel, #molecule-newCollection .orcancel .cancel', function () {
    var parentDiv = $(this).closest('div[id$="-edit"]')
    var domBaseId = parentDiv.attr('id').match(/(.+)-edit/)[1]
    hideEditPanel(domBaseId)
  })

  $(document).on('click', '.editableData-editLink, .editableData-editLink a', function () {
    var formId = (this.dataset.formid === 'null') ? null : this.dataset.formid
    showEditPanel(this.dataset.dombaseid, formId)
  })

  $(document).on('click', '#search_results #display_options .editableData-editLink-save .cancel', function () {
    resetDisplayOptionsForm()
    $('#search_results').scrollTo()
  })

  $(document).on('click', '.approve-publication-request', function () {
    $(this).closest('form').find('#approve').val(true)
  })

  $(document).on('click', '#reject-data-import', function () {
    $(this).closest('form').find('#reject').val(true)
  })

  // project_data_sources/show
  $(document).on('ajax:complete', '.user-projects-toggle .toggleSwitch-control-off', function () {
    $(this).closest('.user-projects-toggle').removeClass('toggle-on')
  })

  $(document).on('ajax:complete', '.user-projects-toggle .toggleSwitch-control-on', function () {
    $(this).closest('.user-projects-toggle').addClass('toggle-on')
  })

  // snapshot_data_sources/show
  $(document).on('ajax:complete', '#show-all-snapshots', function () {
    $('.user-snapshots-toggle').addClass('toggle-on')
  })

  $(document).on('ajax:complete', '#hide-all-snapshots', function () {
    $('.user-snapshots-toggle').removeClass('toggle-on')
  })

  $(document).on('ajax:complete', '.user-snapshots-toggle .toggleSwitch-control-off', function () {
    $(this).closest('.user-snapshots-toggle').removeClass('toggle-on')
  })

  $(document).on('ajax:complete', '.user-snapshots-toggle .toggleSwitch-control-on', function () {
    $(this).closest('.user-snapshots-toggle').addClass('toggle-on')
  })

  $(document).on('ajax:before', '.toggleStar-off, .toggleStar-on', function () {
    $(this).closest('.mainRow').toggleClass('favorite')
  })

  $(document).on('ajax:before', '.alerts-preview-link', function () {
    var params = $(this).closest('.associated-model').find(':input').serialize()
    if (params.trim() !== '') {
      $(this).data('params', params)
    }
  })

  $(document).on('ajax:complete', '.offer_slurp_notification', function () {
    $(this).replaceWith('<span class="success">Notification requested</span>')
  })

  $(document).on('ajax:before', '#toggle_readout_flagging_link', function () {
    var flagging_readouts_input = $($('#sorting_form').prop('flagging_readouts'))
    flagging_readouts_input.val(flagging_readouts_input.val() === 'true' ? 'false' : 'true')
    $(this).data('params', $('#sorting_form').serialize())
  })

  $(document).on('ajax:before', '.flag-readout-link', function () {
    $(this).closest('.flaggable').toggleClass('flagged')
  }).on('ajax:success', '.flag-readout-link', function () {
    var moleculeId = $(this).closest('tr').attr('class').match(/molecule_row_(\d+)/)
    if (moleculeId) {
      CDD.reloadSearchResultRow(moleculeId[1])
    }
  })

  // this prevents columnSelected from being run after deleting a column
  $(document).on('click', '.delete-virtual-field', function (ev) {
    ev.stopImmediatePropagation()
  }).on('ajax:success', function () {

  })

  $(document).on('click', '.announcement .close', function () {
    $(this).closest('.announcement').hide()
  })

  $(document).on('click', '.oneshot-link-to', function () {
    $(this).off('click').addClass('disabled')
  })

  $(document).on('click', '.oneshot-link-to-buttony', function () {
    $(this).off('click')
    $(this).on('click', function (ev) {
      ev.preventDefault()
      ev.stopImmediatePropagation()
      return false
    })
    $(this).addClass('disabled')
  })

  $(document).on('click', '.collapsible-title', function () {
    var block = $(this).closest('.collapsible')
    var table_exists = $(this).next().find('.dataTable,.dataLoaded').length

    if (!block.hasClass('disabled')) {
      var path = $(this).data('title-link-path')
      var unfiltered_context = $(this).data('unfiltered-context')

      if (path && block.hasClass('collapsible-closed') && !table_exists) {
        $.ajax({
          url: path,
          type: 'GET',
          data: { unfiltered_context: unfiltered_context },
        })
      }

      block.toggleClass('collapsible-open').toggleClass('collapsible-closed')
      if (block.hasClass('collapsible-open')) {
        block.find(':focusable:visible:first').focus()
      }
    }
  })

  $(document).on('change', '.criterion-select', function () {
    var criterionForm = $(this).closest('[data-criterion-index]')
    var path = $(this).data('protocolCriteriaChangedPath')

    var data = {
      update_row_id: criterionForm.data('criterionIndex'),
    }

    criterionForm.find(':input:visible').each(function (index, element) {
      var elementName = element.name.replace(/\[\]/g, '')
      if (
        this.name != 'data_set_or_protocol[]' ||
        elementName == 'protocol_negation' ||
        elementName == 'data_set_or_protocol' ||
        elementName == 'protocol_criterion_type[]' ||
        elementName == 'protocol_field'
      ) {
        data[elementName] = element.value
      }
    }.bind(this))

    $.ajax(path, {
      async: true,
      method: 'GET',
      dataType: 'script',
      data: data,
    })
  })

  $(document).on('change', '.criterion-runs-select', function () {
    var criterionForm = $(this).closest('[data-criterion-index]')
    var value = $(this).val()
    var $runDates = criterionForm.find('.run-dates-selects')
    var $runId = criterionForm.find('.run-id-select')
    const $sinceDaysAgo = criterionForm.find('.since-days-ago')

    switch (value) {
      case 'any':
        $runDates.hide()
        $runId.hide()
        $sinceDaysAgo.hide()
        break
      case 'run_date':
        $runDates.show()
        $runId.hide()
        $sinceDaysAgo.hide()
        break
      case 'run_id':
        $runDates.hide()
        $runId.show()
        $sinceDaysAgo.hide()
        break
      case 'recent':
        $runDates.hide()
        $runId.hide()
        $sinceDaysAgo.show()
        break
    }
  })

  // Accept/Reject toggles on QC report
  $(document).on('click', '.eventCategory a.toggleSwitch-control-on, .eventCategory a.toggleSwitch-control-off', function () {
    if ($(this).hasClass('toggleSwitch-control-on')) {
      $(this).closest('.toggleSwitch').addClass('toggleSwitch-on')
    } else {
      $(this).closest('.toggleSwitch').addClass('toggleSwitch-off')
    }
    $('#globalAjax').show()
    CDD.ModalOverlay.show()
  })

  // because of where this code is loaded we might not have access to this straight away so wrap it up
  $(document).on('click', '#export_progress_message a.download', function (ev) {
    if ($(this).data('disabled')) {
      ev.preventDefault()
      ev.stopImmediatePropagation()
      return false
    }
    CDD.Export.downloadClicked()
  })

  $(document).on('click', '#export_progress_message a.cancel', function (ev) {
    if ($(this).data('disabled')) {
      ev.preventDefault()
      ev.stopImmediatePropagation()
      return false
    } else {
      $(this).data('disabled', true)
    }
  })

  $(document).on('ajax:complete', '#export_progress_message a.cancel', function (ev, xhr, status) {
    if (status == 'success') {
      $('#export_progress_message').fadeOut()
      CDD.Export.enable()
    } else {
      $(this).data('disabled', false)
    }
  })

  $(document).on('click', 'td.selector', function () {
    CDD.SearchResultSelection.toggleRow(this)
    return false
  })

  $(document).on('click', '#show_all_protocol_data_form + p.subhead > strong > a', function () {
    $('#globalAjax').show()
    $('#show_all_protocol_data_form').submit()
    return false
  })

  $(document).on('click', '#save_resource_project_changes', function () {
    CDD.disable($(this))
    $(this).closest('form')[0].submit()
    return false
  })

  $(document).on('click', '#edit_resource_projects_cancel_link', function () {
    $('#edit_resource_projects').remove()
    $('#resource-projects-container').show()
  })

  $(document).on('click', ".percent_inhibition input[type='checkbox'], .percent_negative input[type='checkbox']", function () {
    $(this).val($(this).prop('checked'))
  })

  $(document).on('click', '#bestFit', function () {
    var lockedFitParameters = $(this).closest('td').find('.locked-fit-parameters')
    lockedFitParameters.hide()

    $('.protocol-readouts-edit-fitParameters-LockedFit :input').val('')

    $('.dose-response-upper-value').hide()
  })

  $(document).on('click', '#lockedFit', function () {
    $(this).closest('td').find('.locked-fit-parameters').show()
    // needs to select as well
    $('#dose_response_calculation_minimum_fit_type').focus()
  })

  $(document).on('click', '#default_minimum_activity', function () {
    $('.minimumActivity').hide()

    $('#dose_response_calculation_minimum_inactivity_modifier').val('')
    $('#dose_response_calculation_inactivity_lower_bound').val('')
    $('#dose_response_calculation_inactivity_upper_bound').val('')

    $('#inactivity-upper-bound').hide()
  })

  $(document).on('click', '#customized_minimum_activity', function () {
    $('.minimumActivity').show()
    $('#dose_response_calculation_minimum_inactivity_modifier').trigger('change')
  })

  $(document).on('change', '.calculationType', function () {
    CDD.DoseResponseForm.selectCalculation(this)
  })

  $(document).on('change', '#dose_response_calculation_normalization_option, #dose_response_calculation_normalization_calculation_type', function () {
    CDD.DoseResponseForm.setNormalizationOptions.call(this)
  })

  $(document).on('change', '#dose_response_calculation_normalization_option', function () {
    var form = $(this).closest('form')
    var minimumActivityUnit = form.find('.minimum-activity-unit')
    var responseUnitLabel = form.find('.response-unit-label')
    CDD.DoseResponseForm.toggleMinimumActivityUnit(minimumActivityUnit, $(this).find('option:selected').val(), responseUnitLabel.val())
  })

  $(document).on('keyup', '.response-unit-label', function () {
    var minimumActivityUnit = $(this).closest('form').find('.minimum-activity-unit')
    var thisVal = $(this).val()
    CDD.DoseResponseForm.setMinimumActivityUnit(minimumActivityUnit, thisVal, 'dose_response_calculation_normalization_option')
  })

  $(document).on('change', '.page-select, .per-page-select', function () {
    this.form.submit()
  })

  $(document).on('click', '.sortable-header', function () {
    $('#globalAjax').show()
  })

  $(document).on('click', '.filter-radio', function () {
    $('#globalAjax').show()
    this.form.submit()
  })

  $(document).on('change', '.alert-type', function (event) {
    var src = event.target
    $('#' + src.id.replace('alert_type', 'protocol_id')).toggle(src.value == 'DetailRow')
  })

  $(document).on('click', '#headerSwitcher-current', function () {
    $('#headerSwitcher-select').toggle()
    return false
  })

  $(document).on('mouseover', '.heat-map-well', function (event) {
    CDD.HeatMap.previewWellDetails(event)
  }).on('click', '.heat-map-well', function (event) {
    CDD.HeatMap.showWellDetails(event)
    CDD.HeatMap.clickFlagEvent = event
  })

  $(document).on('ajax:before', '.flag-readout-heatmap-link', function () {
    $(this).closest('.flaggable').toggleClass('flagged')
  }).on('ajax:success', '.flag-readout-heatmap-link', function () {
    const plate_id = $(this).closest('.flaggable').data('plate-id')
    const url = $('#heatMap-wrapper_plate_' + plate_id).data('run-heat-map-path')
    const ajaxOptions = {
      url: url,
      method: 'GET',
      error: function (jqXHR, response) {
        alert('Error performing asynchronous fetch to (' + url + '): ' + response.errorMessage)
      },
    }

    CDD.ConnectionPool.enqueue(ajaxOptions)
  })

  $(document).on('change', '.heat-map-readout-definition-dropdown', function () {
    $('#globalAjax').show()
    this.form.submit()
  })

  $(document).on('change', '#readout-selection select', function () {
    $('#globalAjax').show()
    this.form.submit()
  })

  $(document).on('change', '#plotter-options-axes-scatter-x', function () {
    plotter.selectXAxis($(this).val())
  })

  $(document).on('change', '#plotter-options-axes-scatter-y', function () {
    plotter.selectYAxis($(this).val())
  })

  $(document).on('change', '#plotter-options-points-series', function () {
    plotter.selectSeries($(this).val())
  })

  $(document).on('change', '#plotter-options-points-size', function () {
    plotter.setPointSize($(this).val())
  })

  $(document).on('click', '.plotter-stats', function () {
    $('#plotter-stats').toggle()
  })

  $(document).on('click', '.mean-display', function () {
    plotter.toggleMeanDisplay()
  })

  $(document).on('click', '.standard-deviation-display', function () {
    plotter.toggleStandardDeviationDisplay()
  })

  $(document).on('keyup', '.standard-deviation-multiplier', function () {
    plotter.setStandardDeviationMultiplier($(this).val())
  })

  $(document).on('keyup', '#plotter-options-title', function () {
    plotter.userChangedOptions()
  })

  $(document).on('keyup', '#plotter-options-xAxisTitle', function () {
    plotter.userChangedOptions()
  })

  $(document).on('keyup', '#plotter-options-yAxisTitle', function () {
    plotter.userChangedOptions()
  })

  $(document).on('click', '#plotter-options-legend', function () {
    plotter.userChangedOptions()
  })

  $(document).on('click', '#plotter-options-grid', function () {
    plotter.userChangedOptions()
  })

  $(document).on('change', '.project-members-userSelect', function () {
    CDD.Projects.onUserSelection($(this))
  })

  $(document).on('click', '#savedSearch-private', function () {
    $('#search_project_id').prop('disabled', $(this).prop('checked'))
  })

  $(document).on('click', '#collection-private', function () {
    $('#vault_collection_project_id').prop('disabled', $(this).prop('checked'))
  })

  $(document).on('click', '#addTo_new', function () {
    $('#addToCollection-form').show()
    $('#addToExistingCollection-form').hide()
    $('#collection-name').select()
  })

  $(document).on('click', '#addTo_existing', function () {
    $('#addToCollection-form').hide()
    $('#addToExistingCollection-form').show()
  })

  $(document).on('change', '.protocol-readout-operator', function () {
    var selectedOperator = $(this).find('option:selected').val()
    var readoutMaximum = $(this).closest('.selection').find('.readout-maximum')
    var readoutValue = $(this).closest('.selection').find('.readout-value')

    if (selectedOperator == $(this).data('rangeOperator')) {
      readoutMaximum.show()
    } else {
      readoutMaximum.hide()
    }

    if (selectedOperator.trim() === '') {
      readoutValue.hide()
    } else {
      readoutValue.show()
    }
  })

  $(document).on('click', '.project-checkbox, .data-set-checkbox', function () {
    window.CDD.DataSourceSelection.selectionChanged($(this).data('updateUrl'), $(this).prop('checked'))
  })

  $(document).on('mouseout', '.dataSourcesFakeLink', function () {
    balloon.hideTooltip.call(this)
  }).on('mouseover', '.dataSourcesFakeLink', function (event) {
    balloon.showTooltip(event, 'load:' + $(this).data('balloonId'))
  })

  // Can't click on a disabled link.  But you can mousedown on it!
  $(document).on('mousedown', 'a.disabled[title]', function (event) {
    balloon.showTooltip(event, event.currentTarget.title)
    event.stopImmediatePropagation()
    event.preventDefault()
  })

  $(document).on('ajax:beforeSend', '#addToCollection-form, #buildModel-form', function (event, jqXHR, xhr) {
    xhr.data = xhr.data + (CDD.SearchResultSelection ? ('&' + CDD.SearchResultSelection.toQueryString()) : '')
  })

  $(document).on('submit', '#existing_file_selector_associated', function () {
    opener.processAssociatedFileSelections(this)
    window.close()
    return false
  })

  $(document).on('submit', '#existing_file_selector_single', function () {
    opener.processSingleFileSelection(this, $(this).data('targetInputId'))
    window.close()
    return false
  })

  $(document).on('submit', '#newUploadForm', function () {
    (new CDD.DataFile()).upload(this)
    return false
  })

  $(document).on('keypress', 'form.submitOnEnter', function (event) {
    if (event.keyCode == $.ui.keyCode.ENTER) {
      $(this).trigger('submit')
      event.stopImmediatePropagation()
      event.preventDefault()
    }
  })

  $(document).on('click', '.remove-associated-model', removeAssociatedModel)
  $(document).on('click', '.delete_condition .remove-associated-model', fixCollectionCriteriaJunctions)

  $(document).on('click', '.open-file-viewer', function (event) {
    var href = $(this).attr('href')
    openMiniApp(href, 'file_viewer')
    event.preventDefault()
    event.stopImmediatePropagation()
    return false
  })

  $(document).on('click', '.open-popup', function (event) {
    var href = $(this).attr('href')
    window.open(href)
  })

  $(document).on('focus', '.select-on-focus', function () {
    this.select()
  })

  $(document).on('click', '#user_vault_selector .input_submit', function () {
    $('#user_vault_selector_format').val('html')
  })

  $(document).on('click', '#sidebar-new_collection_link', function () {
    showEditPanel('molecule-newCollection', 'addToCollection-form')
    window.location.hash = 'molecule-collections'
  })

  $(document).on('click', '#sidebar-new_specified_batch_link', function () {
    showEditPanel('molecule-newBatch', 'new_specified_batch')
    window.location.hash = 'molecule-batches'
  })

  $(document).on('click', '#manage-project-access', function () {
    window.location.hash = 'resource-projects'
  })

  $(document).on('click', '#add-definition-first', function () {
    showContainerTab('protocol-details')
    window.location.hash = 'protocol-readoutsAndCalculations'
    showNewReadoutDefinitionForm()
  })

  $(document).on('click', '[data-mini-app-path]', function () {
    openMiniApp($(this).data('miniAppPath'), $(this).data('miniAppName'))
  })

  $(document).on('click', '#newColumnLink', function () {
    showDialog('addAColumn-dialog')
  })

  $(document).on('click', '#saveMappingTemplate-link', function () {
    showDialog('saveMappingTemplate-dialog')
  })

  $(document).on('click', '#moveRun-link', function () {
    showDialog('moveRun-dialog')
  })

  $(document).on('click', '#confirmProject-link', function () {
    showDialog('confirmProject-dialog')
  })

  function warningMessageBuilder(data) {
    var batch_count = data.batch_count,
      molecule_count = data.molecule_count
    if (batch_count === 0 && molecule_count === 0) {
      $('#run-move-checkbox').prop('checked', true)
      $('#move_run_button').removeClass('disabled')
    } else {
    // For the molecule count:
      var molecule_word
      if (molecule_count === 1) {
        molecule_word = Terminology.dictionary.molecule + ' and '
      } else {
        molecule_word = Terminology.dictionary['molecule.other'] + ' and '
      }
      if (molecule_count === 0) {
        molecule_count = ''
        molecule_word = ''
      }
      // For the batch count:
      var batch_word
      if (batch_count == 1) {
        batch_word = Terminology.dictionary.batch
      } else {
        batch_word = Terminology.dictionary['batch.other']
      }
      var message_content = molecule_count + ' ' + molecule_word + batch_count + ' ' + batch_word + ' will be shared with the new project.'
      $('#message-content').text(message_content)
      $('.warning-message').show()
      $('#move_run_button').addClass('disabled')
    }
  }

  $(document).on('change', '#run_project_id', function () {
    $('.warning-message').hide()
    $('#run-move-checkbox').prop('checked', false)
    $('#move_run_button').addClass('disabled')
    $.ajax({
      url: $('#moveRun-form').data('molecules-and-batches-count-path'),
      type: 'GET',
      dataType: 'json',
      data: { 'id': $('#moveRun-form').data('run-id'), 'new_project_id': $(this).val() },
      success: function (data) {
        warningMessageBuilder(data)
      },
    })
  })

  $(document).on('change', '#run-move-checkbox', function () {
    var move_button = $('#move_run_button')
    if ($(this).is(':checked')) {
      move_button.removeClass('disabled')
    } else {
      move_button.addClass('disabled')
    }
  })

  $(document).on('click', '#exportModel-link', function () {
    showDialog('exportModel-dialog')
  })

  $(document).on('click', '#duplicateProtocol-link', function () {
    showDialog('duplicateProtocol-dialog')
  })

  $(document).on('click', '#saveSearch-link', function () {
    showDialog('saveSearch-dialog')
    $('#saveSearch-light-box').removeClass('hidden')
    $('#search_name').focus()
  })

  $(document).on('click', '#exportOptions_link', function () {
    showDialog('exportOptions-dialog')
    $('#exportOptions-light-box').removeClass('hidden')
    $('#user_preferences_export_format_xlsx').focus()
  })

  $(document).on('click', '[data-mapping-error-id]', function () {
    showDialog($(this).data('mappingErrorId'))
    $('.hasDatepicker').datepicker('setDate', new Date())
  })

  $(document).on('keypress', '#search_name', function (event) {
    if (event.keyCode == $.ui.keyCode.ENTER) {
      $('#save_button').trigger('click')
      event.stopImmediatePropagation()
    }
  })

  $(document).on('click', '.reset-zoom', function () {
    plotter.resetZoom()
  })

  $(document).on('click', '#selectAllRows', function () {
    CDD.SearchResultSelection.selectAllRows()
  })

  $(document).on('click', '#unselectAllRows', function () {
    CDD.SearchResultSelection.unselectAllRows()
  })

  $(document).on('click', '[data-entity]', function () {
    var target = $(this).closest('tr').find(':input:first')
    target.val(target.val() + $(this).data('entity'))
    target.focus()
  })

  $(document).on('click', '#select_all', function () {
    $('.notify_user').prop('checked', true)
  })

  $(document).on('click', '#deselect_all', function () {
    $('.notify_user').prop('checked', false)
  })

  $(document).on('click', '.select-header-group-items', function () {
    $(this).closest('.header-group').find('.header-group-items :checkbox').prop('checked', true)
  })

  $(document).on('click', '.unselect-header-group-items', function () {
    $(this).closest('.header-group').find('.header-group-items :checkbox').prop('checked', false)
  })

  $(document).on('click', '.dataSources-sourceList-toggles-all', function () {
    window.CDD.DataSourceSelection.selectionChanged($(this).data('selectionsPath'), true)
  })

  $(document).on('click', '.dataSources-sourceList-toggles-none', function () {
    window.CDD.DataSourceSelection.selectionChanged($(this).data('selectionsPath'), false)
  })

  $(document).on('click', '[data-warning-id]', function () {
    toggleWarningDetails($(this).data('warningId'))
  })

  $(document).on('click', '[data-pdf-path]', function () {
    plotter.downloadPDF($(this).data('pdfPath'))
  })

  $(document).on('click', '.delete_condition', function () {
    $(this).closest('[data-criterion-index]').remove()
    $('#protocol_criteria [data-criterion-index]:first .protocol_readout_junction').remove()
  })

  $(document).on('click', '.new_salt #structure_preview_editor_link, .edit_salt #structure_preview_editor_link', function () {
    CDD.StructureEditor.openMarvin4JS('salt_smiles', 'archive', { structureFormat: 'cxsmiles' })
  })

  $(document).on('click', '#mine_search_form #structure_preview_editor_link', function () {
    CDD.StructureEditor.openMarvin4JS('structure', 'search', { structureFormat: 'csmol' })
  })

  $(document).on('click', '#molecule-definition-form #structure_editor_launcher, #molecule-new #structure_preview_editor_link', function () {
    CDD.StructureEditor.openMarvin4JS('molecule_smiles')
  })

  $(document).on('click', '#molecule-definition-form #mixture_editor_launcher, #molecule-new #mixture_preview_editor_link', function () {
    let textarea = $('#mixture_data')
    let mixfile_json = textarea.val()
    let dlg = new MixtureEditor(mixfile_json)
    dlg.onSave((edited_json) => textarea.val(edited_json))
    dlg.open()
  })

  $('.onLoadOpenMarvin4JS').click()

  $(document).on('click', '#plate-details #sidebar-delete .cancel', function () {
    CDD.deleteResourceClicked('plate')
  })

  $(document).on('click', '#protocol #sidebar-delete .cancel', function () {
    CDD.deleteResourceClicked('protocol')
  })

  $(document).on('click', '.deleteBatch-link, .deleteMolecule-link', function () {
    $(document).find('.delete-molecule-or-batch-dialog').hide()
    var that = $(this)
    $.ajax({
      url: $(this).data('deletion-warning-path'),
      type: 'GET',
      success: function () {
        showDialogOfElement(that.siblings('.delete-molecule-or-batch-dialog'))
      },
    })
  })

  $(document).on('change', '.delete-molecule-or-batch-checkbox', function () {
    $(this).parent().next().children('.delete-molecule-or-batch').toggleClass('disabled')
  })

  $(document).on('click', '.delete-molecule-or-batch', function () {
    CDD.disable($(this))
    return false
  })

  $(document).on('click', '#moleculeSwitcher-link', function () {
    $('#moleculeSwitcher-select').show()
  })

  $(document).on('click', '[data-new-collection-share-path]', function () {
    CDD.ShareDialog.open(this, $(this).data('newCollectionSharePath'))
  })

  $(document).on('click', '#export_report', function () {
    $('#vault_report_form_format').val('csv')
    $('#vault_report_form').trigger('submit')
  })

  $(document).on('click', '#export_members', function () {
    $('#vault_members_report_form').trigger('submit')
  })

  $(document).on('click', '.submit-with-hidden', function () {
    var form = $(this).closest('form')
    form.find("[name='format']").val('html')
    form.trigger('submit')
  })

  $(document).on('click', '.file .actions .cancel', function () {
    removeReadoutFile(this)
  })

  $(document).on('click', '[data-easy-text-copy]', attemptToCopy)

  $(document).on('click', '.search-showDetails', function () {
    var mainRow = $(this).closest('.mainRow')
    mainRow.find('.search-showDetails').hide()
    mainRow.find('.search-hideDetails').show()
  })

  $(document).on('click', '.search-hideDetails', function () {
    var mainRow = $(this).closest('.mainRow')
    mainRow.find('.search-showDetails').show()
    mainRow.find('.search-hideDetails').hide()
    mainRow.next('.search-details').remove()
  })

  $(document).on('click', '[data-tooltip-path]', function (event) {
    var tooltipWidth = $(this).data('tooltipWidth')
    balloon.toggleTooltip(event, $(this).data('tooltipPath'), true, tooltipWidth)
  })

  $(document).on('click', '.remove-file', function () {
    $(this).closest('tr').remove()
  })

  $(document).on('click', '[data-select-single-files-path]', function () {
    openSingleFileSelector.call(this)
  })

  $(document).on('click', '[data-select-associated-files-path]', function () {
    openAssociatedFileSelector.call(this)
  })

  $(document).on('click', '.search-link', function () {
    $(this).prev('form').trigger('submit')
  })

  $(document).on('click', '.toggle-publication-request-response', function (event) {
    balloon.toggleTooltip(event, $(this).next('.publication-request-response').html(), 1)
  })

  $(document).on('click', '#objectOwnerDetailsLink', function (event) {
    balloon.toggleTooltip(event, 'load:objectOwnerDetails', 1)
  })

  $(document).on('click', '.eventSection [data-balloon-id]', function (event) {
    balloon.showTooltip(event, 'load:' + $(this).data('balloonId'))
  })

  $(document).on('click', '#edit_detail_row_cancel_link', function () {
    $(this).closest('.run-readout-edit').remove()
    $('#run-readouts-container').show()
  })

  $(document).on('click', '#add_key', function () {
    CDD.resetElementToInitialState($('#new_key_row')[0])
    $('#new_key_row').show().focusFirst()
    $('#add_key').hide()
  })

  $(document).on('click', '#api_key_form #new_key_row .cancel', function () {
    $('#new_key_row').hide()
    $('#newApiKey-errors').hide()
    $('#add_key').show()
  })

  $(document).on('click', '.molecule-batch-edit .editableData-editLink-save .cancel', function () {
    $(this).closest('.molecule-batch-edit').remove()
    $('#molecule-batches-container').show()
  })

  $(document).on('click', '#shareDialog-close', function () {
    CDD.ShareDialog.destroy()
  })

  $('#dataSources-public .dataSources-source-hide').on('click', function () {
    var snapshotVisibilityPath = $(this).data('snapshotVisibilityPath')
    window.CDD.DataSourceSelection.selectionChanged(snapshotVisibilityPath, false)
  })

  $('#dataSources-projects .dataSources-source-hide').on('click', function () {
    var projectVisibilityPath = $(this).data('projectVisibilityPath')
    // we don't actually need to do the full selectionChanged thing if the project wasn't selected, but this is simpler
    window.CDD.DataSourceSelection.selectionChanged(projectVisibilityPath, true)
  })

  $('#protocol-readouts-edit-fitParameters-LockedFit select').trigger('change')

  $(document).on('click', '#projects [data-project-id]', function () {
    accessManager.removeProject(this)
  })

  $(document).on('click', '#add-plate-specific-layout', function () {
    showEditPanel('controlLayouts-newPlate', true)
  })

  $(document).on('ajax:before', '.delete-readout-row', function () {
    $(this).data('params', $.param({
      visible_detail_row_ids: collectDetailRowIds(),
    }))
  })

  $(document).on('click', '#mappingTemplateWizard-step2-backLink', function () {
    $('#mappingTemplateWizard-step1').show()
    $('#mappingTemplateWizard-step2').hide()
  })

  $(document).on('click', '#enter-research-interests', function () {
    showEditPanel('accountSettings', null)
    $('#user_research_summary').focusFirst()
  })

  $(document).on('click', '#set-your-own-terminology', function () {
    showEditPanel('dashboard-vaultLingo', true)
  })

  $(document).on('click', '[data-file]', function () {
    CDD.setFileHistoryVisibility($(this).data('file'))
  })

  // When the document loads, we want to go to the right tab [and scroll to the right entry]
  // If the URL is like ../molecules/<ID>#tab-name[/<id>]
  // Then we want to jump to that tab [and scroll to that id]
  $(document).ready(function () {
    let anchor = window.location.hash
    const baseHash = /#([\w-]+)\/?(\d+)?/g // eslint-disable-line security/detect-unsafe-regex
    const match = baseHash.exec(anchor)
    if (match && match.length > 0) {
      const rootLocation = match[1]
      let tabElement = $(`#${rootLocation}Link[data-show-container-tab]`)
      if (tabElement.length == 1) {
        showContainerTab(rootLocation)
        const batchID = match[2]
        $(`#list-batch-${batchID}`).scrollTo()
      }
    }
  })
  // When you click on a tab...
  $(document).on('click', '[data-show-container-tab]', function (e) {
    window.location.replace(this.href)
    // hashchange, below, will select the tab
    // This is so that pasting a URL with a different hash will work
    e.preventDefault()
    return false
  })
  // When the selected hash changes (but the root URL does not) we want to make sure we are on the right tab -
  // but let the browser handle the getting to the entry portion
  $(window).on('hashchange', function (e) {
    // Grab the part of the hash before the / (#molecule-batches/123456 -> molecule-batches)
    const baseHash = /#([^/]+)/g
    const match = baseHash.exec(location.hash)
    if (match) {
      const rootLocation = match[1]
      if ($(`#${rootLocation}.container-tab`)[0]) {
        showContainerTab(rootLocation)
        $(`#${rootLocation}.container-tab form`).focusFirst()
        return false
      }
    }
  })

  $(document).on('click', '#plate-mapLink', function () {
    var container = $('#plate-map-container')
    var th = container.find('.cells th')
    container.find('.corner').height(th.height()).width(th.width())
    container.find('.cells').scrollLeft(0)
  })

  $(document).on('click', '[data-export-path][data-export-progress-path]', function () {
    const searchParams = new URLSearchParams(window.location.search)
    let additionalParams = {}
    if (searchParams.has('text')) {
      additionalParams = Object.assign(additionalParams, { text: searchParams.get('text') })
    }
    if (searchParams.has('mrv')) {
      additionalParams = Object.assign(additionalParams, { mrv: searchParams.get('mrv') })
    }

    CDD.Export.submit(this.dataset.exportPath, this.dataset.exportProgressPath, additionalParams)
  })

  $(document).on('click', 'a.cancel', function (event) {
    Pollers.stop('export')
  })

  $(document).on('click', '.ajax-replace', function (event) {
    var data = this.dataset

    var replaceHTML = function (html) {
      // eslint-disable-next-line jquery-unsafe/no-html
      $(data.selector).html(html)
    }
    var displayError = function () {
      var message = data.error || 'There was an error with the request.'
      // eslint-disable-next-line jquery-unsafe/no-html
      insertGlobalError($('<p>').html(message.escapeHTML()))
    }

    $.get(data.url)
      .done(replaceHTML)
      .fail(displayError)
  })

  /*
    The element to which this click handler is attached is expected to have at least one attribute
      attached to it:
        . "parent-state-root-selector" which defines a jquery selector that will be used with closest()
            to find the parent whose children input tags will have their disabled state set to the
            logical not of the source element's .is(':checked') return
     Further, an optional attribute may exist:
        . "inversely-affect-parent-peers" which is assumed to be a boolean value. If it is true, then
            the parent of the above parent will have its children's inputs' disabled state set to the
            opposite of the source parent's children inputs' disabled state; if this is false, there's
            no point to seeting it.
   */
  $(document).on('click', '.parent-input-state-changer', function (event) {
    const jqThis = $(this)
    const shouldEnableOurInputs = jqThis.is(':checked')
    const parentStateRootSelector = jqThis.attr('parent-state-root-selector')
    const shouldAffectPeers = jqThis.attr('inversely-affect-parent-peers') === 'true'
    const parentStateRoot = jqThis.closest(parentStateRootSelector)

    parentStateRoot.find(':input').not('.parent-input-state-changer').prop('disabled', !shouldEnableOurInputs)

    if (shouldAffectPeers) {
      const grandparent = parentStateRoot.parent()

      grandparent.children().each(function (index, child) {
        const jqChild = $(child)

        if (!jqChild.is(parentStateRoot)) {
          jqChild.find(':input').not('.parent-input-state-changer').prop('disabled', shouldEnableOurInputs)
        }
      })
    }
  })
}

$(registerGlobalEventHandlers)

export default registerGlobalEventHandlers
