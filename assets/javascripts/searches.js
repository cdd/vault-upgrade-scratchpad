import './compatibility.jquery.js'
require('jquery-ui-bundle/jquery-ui')

if (window.CDD === undefined) {
  window.CDD = {}
}

// var openMiniApp
// var CDD = {}

window.initSortableHeaderGroups = function () {
  $('#header_groups').sortable({
    axis: 'y',
    opacity: 0.7,
    revert: 20,
    items: '.draggable',
    handle: '.drag_handle',
    start: function (event, ui) {
      ui.helper.finish()
    },
  })
}

// eslint-disable-next-line no-unused-vars
window.replaceRowsOfClassWithContent = function (moleculeId, content) {
  $('.molecule_row_' + moleculeId).each(function (index) {
    index === 0 ? $(this).replaceWith(content) : $(this).remove()
  })
  window.CDD.SearchResultSelection.setRowState(moleculeId)
}

export function insertCurrentDisplayOptions() {
  var searchForm = $('#mine_search_form')
  var currentDisplayOptionsForm = $('#current_display_options_form')
  if (currentDisplayOptionsForm.length === 0) { return }

  var searchFormDisplayOptionsDiv = $('#mine_search_form-display_options')
  if (searchFormDisplayOptionsDiv.length === 0) {
    searchFormDisplayOptionsDiv = $('<div id=\'mine_search_form-display_options\'>')
    searchForm.append(searchFormDisplayOptionsDiv)
  }

  searchFormDisplayOptionsDiv.html(currentDisplayOptionsForm[0].innerHTML)
}

export function toggleDisplayOptionsForm() {
  $('#display_options_link').toggleClass('active')
  $('#display_options').toggle()
  $('.search_results_table').toggle()
  $('#search_results-protocolsHidden').toggle()
  $('#addToCollection-notice').toggle()
  initSortableHeaderGroups()
}

export function toggleHeaderGroupItems(checkbox) {
  var items_div = $('#header_group_' + checkbox.val() + '_items')
  var items_name = 'displayed_header_ids[' + checkbox.val() + '][]'

  if (checkbox.prop('checked')) {
    checkbox.closest('form').find('input[name~=\'' + items_name + '\'][type=\'checkbox\']')
      .show()
      .not(function () { return $(this).hasClass('unchecked_by_default') })
      .prop('checked', true)
    items_div.show()
    $('#header_group_' + checkbox.val() + '_all_none_links').show()
  } else {
    items_div.hide()
    checkbox.closest('form').find('input[name~=\'' + items_name + '\'][type=\'checkbox\']')
      .prop('checked', false)
      .hide()
    $('#header_group_' + checkbox.val() + '_all_none_links').hide()
  }
}

// eslint-disable-next-line no-unused-vars
window.resetDisplayOptionsForm = function () {
  toggleDisplayOptionsForm()
  $('#display_options_form')[0].reset()
  var group_checkbox
  $('#display_options_form').find('input[name~=\'header_group_displayed[]\'][type=\'checkbox\']').each(function () {
    group_checkbox = this
    var items_div = $('#header_group_' + group_checkbox.value + '_items')
    if ($(group_checkbox).prop('checked') != items_div.is(':visible')) {
      items_div.toggle()
      toggleHeaderGroupItems($('#header_group_displayed_' + group_checkbox.value))
    }
  })

  var sorted_header_group_elts = $('#current_display_options_form').children().filter(function () {
    return this.name == 'header_group_order[]'
  })

  var sorted_draggable_elts = sorted_header_group_elts.toArray().map(function (sorted_header_group) {
    return $('#header_group_' + sorted_header_group.value + '_draggable')
  })

  _.forEach(sorted_draggable_elts, function (element) {
    element.remove()
    // eslint-disable-next-line jquery-unsafe/no-append
    $('#header_groups').append(element)
  })

  // eslint-disable-next-line jquery-unsafe/no-append
  $('#header_groups').append($('#header_group_placeholder'))

  _.forEach(window.CDD.protocolsHandler.getAlreadyDisplayedProtocols(), function (protocol_id) {
    if (!(_.includes(JSON.parse($('#already_added_protocol_ids').val()), protocol_id))) { $('#header_group_' + protocol_id + '_draggable').remove() }
  })

  window.CDD.protocolsHandler.resetAlreadyDisplayedProtocols($('#already_added_protocol_ids').val())
  window.CDD.protocolsHandler.resetFilteredProtocolsList()
}

// Override default behavior
window.CDD.Export.submit = function (export_path) {
  window.CDD.Export.disable()
  window.scrollTo(0, 0)
  var queryParameters = $('#export_options_form').serialize()
  if (queryParameters !== '') {
    queryParameters += '&'
  }
  queryParameters += CDD.SearchResultSelection.toQueryString()

  $.ajax(export_path, {
    async: true,
    method: 'POST',
    dataType: 'script',
    data: queryParameters,
  })
}

function showProcessingSearchMessage() {
  $('#long_search_notice').show()
  // Ugly hack to force IE to reload the image and animate it...
  // http://stackoverflow.com/questions/1077041/refresh-image-with-a-new-one-at-the-same-url/9943419#9943419
  setTimeout(function () { $('#long_search_notice_image').attr('src', $('#long_search_notice_image').attr('src') + '#rnd' + new Date().getTime()) }, 200)
}

if (window.CDD === undefined) { window.CDD = {} }
var CDD = {}

CDD.reloadSearchResultRow = function (moleculeId) {
  $('#reload_row_link_' + moleculeId).trigger('click')
}

CDD.plotMoleculeSelection = function (url) {
  'use strict'
  return CDD.openMoleculeSelection(url, 'plotter', '')
}

CDD.launchVision = function (url) {
  'use strict'
  return CDD.openMoleculeSelection(url, 'vision', '')
}

CDD.openMoleculeSelection = function (url, resource, windowOptions) {
  'use strict'
  var win = window.openMiniApp('', '_blank', windowOptions)

  $.ajax(url, {
    async: false,
    method: 'POST',
    data: CDD.SearchResultSelection.toQueryString(),
    success: function (data) {
      win.location.href = data + '/' + resource
    },
  })
  return false
}

CDD.setupSearchResultsLoader = function () {
  'use strict'
  var linkElt = $('#incrementalLoadLink')[0],
    containerElt = $(linkElt).closest('tfoot'),
    sortingLimitElt = $('#sorting_form #limit'),
    displayOptionsLimitElt = $('#display_options_form #limit'),
    dataset = $(linkElt).data(),
    limit = parseInt(dataset.limit, 10),
    total = parseInt(dataset.total, 10),
    hasDuplicates = dataset.has_duplicates === true,
    loaded = 0

  linkElt.updateLink = function () {
    loaded += limit
    sortingLimitElt.val(loaded)
    displayOptionsLimitElt.val(loaded)
    var remaining = total - loaded,
      structures = (remaining === 1) ? ' result...' : ' results...',
      qualifier = hasDuplicates ? ' unique ' : ''

    if (remaining > limit) {
      // eslint-disable-next-line jquery-unsafe/no-html
      $(this).html('Load next ' + limit + qualifier + structures)
    } else {
      // eslint-disable-next-line jquery-unsafe/no-html
      $(this).html('Load remaining ' + remaining + qualifier + structures)
    }
    var last_molecule_id = $('#result_rows').children('tr:last').attr('id')
    $(this).attr('href', '#' + last_molecule_id)

    if (remaining > 0) {
      containerElt.show()
    } else {
      containerElt.hide()
    }
  }

  linkElt.onclick = function () {
    var that = this
    $.ajax(dataset.url, {
      async: true,
      dataType: 'script',
      method: 'GET',
      data: {
        offset: loaded,
        limit: limit,
      },
      complete: function () {
        that.updateLink()
        CDD.SearchResultSelection.setAllRowStates()
      },
    })
  }
  linkElt.updateLink()
}

CDD.SearchResultSelection = (function () {
  var allToggleSwitches = function () {
    return $('.selector .toggleSwitch')
  }

  var toggleSwitchRows = function (toggleSwitch) {
    if (toggleSwitch.length > 0) {
      var moleculeId = toggleSwitch.first().closest('tr').attr('id').match(/molecule_(\d+)_row/)[1]
      return $('.molecule_row_' + moleculeId)
    } else {
      return toggleSwitch
    }
  }

  var unselectRow = function (toggleSwitch) {
    toggleSwitch.removeClass('toggleSwitch-on').addClass('toggleSwitch-off')
    toggleSwitchRows(toggleSwitch).addClass('unselected')
  }

  var selectRow = function (toggleSwitch) {
    toggleSwitch.addClass('toggleSwitch-on').removeClass('toggleSwitch-off')
    toggleSwitchRows(toggleSwitch).removeClass('unselected')
  }

  var baseSelectionHandler = {
    initialize: function (that, toggleAll) {
      allToggleSwitches().each(function (index, element) {
        that.setDefaultSelectionState($(element))
      })
      that.exceptMoleculeIds = window.CDD.History.restoreSelectionState(toggleAll)
      that.exceptMoleculeIds.forEach(function (id) {
        that.setRowState(id)
      })
      that.updateSearchResultsActionsHeader()
    },

    recordSelectionState: function (moleculeId, toggleSwitchIsOn) {
      if (this.removeFromExceptionList(toggleSwitchIsOn)) {
        this.exceptMoleculeIds = _.without(this.exceptMoleculeIds, moleculeId)
      } else {
        this.exceptMoleculeIds.push(moleculeId)
      }
      window.CDD.History.persistSelectionState(this.exceptMoleculeIds)
      this.updateSearchResultsActionsHeader()
    },

    toggleRow: function (selectorCell) {
      var moleculeId = parseInt($(selectorCell).parent().attr('class').match(/\d+/)[0], 10)
      var toggleSwitch = $(selectorCell).find('.toggleSwitch:first').toggleClass('toggleSwitch-on').toggleClass('toggleSwitch-off')
      toggleSwitchRows(toggleSwitch).toggleClass('unselected')

      this.recordSelectionState(moleculeId, toggleSwitch.hasClass('toggleSwitch-on'))
    },

    setRowState: function (moleculeId) {
      var toggleSwitch = $('#molecule_' + moleculeId + '_row_1 .selector .toggleSwitch:first')
      if (toggleSwitch.length === 0) {
        return // That molecule is not on the page
      }

      if (this.isRowSelected(moleculeId)) {
        selectRow(toggleSwitch)
      } else {
        unselectRow(toggleSwitch)
      }
    },

    setAllRowStates: function () {
      allToggleSwitches().each(function (index, element) {
        this.setDefaultSelectionState($(element))
      }.bind(this))
      _.each(this.exceptMoleculeIds, this.setRowState.bind(this))
      this.updateSearchResultsActionsHeader()
    },

    toQueryString: function () {
      return $.param({
        'selection[default]': this.defaultAsString,
        'selection[except_molecule_ids][]': this.exceptMoleculeIds,
      })
    },

    updateSearchResultsActionsHeader: function () {
      if ($('#selectedResultCount').length === 0) {
        return
      }
      var selectedCount = this.selectedResultCount()

      $('#selectedResultCount').text(selectedCount + ' Selected:')
      $('#search_results_actions a.search_results_action_link').each(function (index, link) {
        selectedCount > 0 && link.id !== 'disabled_cdd_vision_link' ? window.CDD.enable($(link)) : window.CDD.disable($(link))
      })
      if (selectedCount === 0) {
        $('#search_results_table-dialogs .dialog').hide()
      }
      $('#modelSelectedResultCount').text(selectedCount)
    },
  }

  var allSelectedByDefault = Object.create(baseSelectionHandler)
  allSelectedByDefault.defaultAsString = 'all'

  allSelectedByDefault.initialize = function (toggleAll) {
    this.setDefaultSelectionState = selectRow
    baseSelectionHandler.initialize(this, toggleAll)
    return this
  }

  allSelectedByDefault.selectedResultCount = function () {
    return parseInt($('#selectedResultCount').data().totalcount, 10) - this.exceptMoleculeIds.length
  }

  allSelectedByDefault.isRowSelected = function (moleculeId) {
    return !_.includes(this.exceptMoleculeIds, moleculeId)
  }

  allSelectedByDefault.removeFromExceptionList = function (toggleSwitchIsOn) {
    return toggleSwitchIsOn
  }

  var noneSelectedByDefault = Object.create(baseSelectionHandler)
  noneSelectedByDefault.defaultAsString = 'none'

  noneSelectedByDefault.initialize = function (toggleAll) {
    this.setDefaultSelectionState = unselectRow
    baseSelectionHandler.initialize(this, toggleAll)
    return this
  }

  noneSelectedByDefault.selectedResultCount = function () {
    return this.exceptMoleculeIds.length
  }

  noneSelectedByDefault.isRowSelected = function (moleculeId) {
    return _.includes(this.exceptMoleculeIds, moleculeId)
  }

  noneSelectedByDefault.removeFromExceptionList = function (toggleSwitchIsOn) {
    return !toggleSwitchIsOn
  }

  var selectionHandler = null

  $(document).ready(function () {
    if (window.CDD.History.restoreHandlerState() === 'none') {
      selectionHandler = noneSelectedByDefault.initialize()
    } else {
      selectionHandler = allSelectedByDefault.initialize()
    }
  })

  return {
    setSelectionState: function () {
      window.CDD.History.persistSelectionState(selectionHandler.exceptMoleculeIds, selectionHandler.defaultAsString)
    },

    toggleRow: function (selectorCell) {
      selectionHandler.toggleRow(selectorCell)
    },

    selectAllRows: function () {
      selectionHandler = allSelectedByDefault.initialize(true)
      window.CDD.History.persistHandlerState(selectionHandler.defaultAsString)
    },

    unselectAllRows: function () {
      selectionHandler = noneSelectedByDefault.initialize(true)
      window.CDD.History.persistHandlerState(selectionHandler.defaultAsString)
    },

    setRowState: function (moleculeId) {
      selectionHandler.setRowState(moleculeId)
    },

    setAllRowStates: function () {
      selectionHandler.setAllRowStates()
    },

    toQueryString: function () {
      return selectionHandler.toQueryString()
    },

    updateSearchResultsActionsHeader: function () {
      return selectionHandler.updateSearchResultsActionsHeader()
    },
  }
})()

CDD.asynchronousFilteredProtocols = function (elementIds, filterUrl, updateUrl) {
  var unfilteredId = elementIds.unfiltered,
    filteringProtocolsMessageId = elementIds.filteringProtocolsMessageId,
    filteredId = elementIds.filtered,
    existingId = elementIds.existing,
    noProtocolsId = elementIds.noProtocolsId,
    noProtocolsMessage = elementIds.noProtocolsMessage,
    filteredProtocols = document.createElement('select'),
    alreadyDisplayedProtocols = JSON.parse($('#' + existingId).val()),
    noAdditionalProtocolsToDisplay = $('<div id=\'' + noProtocolsId + '\' style=\'display: none\'></div>'),
    filteredProtocolCacheId = elementIds.filteredProtocolCache

  $(filteredProtocols)
    .attr('id', filteredId)
    .css({ display: 'none' })
    .data('add-protocol-url', updateUrl)
    .addClass('protocol-dropdown')

  noAdditionalProtocolsToDisplay.html(noProtocolsMessage.escapeHTML())

  if ($('#' + unfilteredId).length > 0) {
    // eslint-disable-next-line jquery-unsafe/no-before
    $('#' + unfilteredId).before(filteredProtocols)
    // eslint-disable-next-line jquery-unsafe/no-before
    $('#' + unfilteredId).before(noAdditionalProtocolsToDisplay)
  }

  var filteredProtocolsListLoaded = function () {
    return $('#' + filteredProtocolCacheId).val().trim().length > 0
  }

  var removeAlreadyDisplayProtocolsFromOptions = function () {
    var options

    if (filteredProtocolsListLoaded()) {
      options = $('#' + filteredId).children('option')
    } else {
      options = $('#' + unfilteredId).children('option')
    }
    options.each(function (index, option) {
      if (_.includes(alreadyDisplayedProtocols, option.value)) { $(option).remove() }
    })
  }

  var replaceProtocolsDropdown = function () {
    removeAlreadyDisplayProtocolsFromOptions()

    if (filteredProtocolsListLoaded()) {
      if ($('#' + filteredId + ' option').length > 1) {
        $('#' + filteredId).show()
        $('#' + noProtocolsId).hide()
      } else {
        $('#' + filteredId).hide()
        $('#' + noProtocolsId).show()
        $('#' + noProtocolsId).css('display', 'inline')
      }
      if ($('#' + unfilteredId).length > 0) {
        $('#' + unfilteredId).hide()
        $('#' + filteringProtocolsMessageId).hide()
      }
    }
  }

  var generateProtocolOptions = function (protocolNamesAndIds) {
    if ($('#' + filteredId).length > 0) {
      $('#' + filteredId).empty()
      protocolNamesAndIds.forEach(function (nameIdPair) {
        // eslint-disable-next-line jquery-unsafe/no-append
        $('#' + filteredId).append(new Option(nameIdPair[0], nameIdPair[1]))
      })
    }
  }

  var unobtrusivelyUpdateProtocolDropdown = function (responseText) {
    var protocolNamesAndIds = JSON.parse(responseText)
    generateProtocolOptions(protocolNamesAndIds)

    if ($('#' + unfilteredId).length > 0) {
      $('#' + filteredProtocolCacheId).val(responseText)
      if ($('#' + unfilteredId)[0].state === 'closed' || $('#' + unfilteredId)[0].state === undefined) {
        replaceProtocolsDropdown()
      } else {
        $('#' + unfilteredId).on('blur', replaceProtocolsDropdown)
      }
    }
  }

  var failGracefully = function () {
    $('#' + filteringProtocolsMessageId).hide()
  }

  var updateProtocolDropdownFromResponse = function (data) {
    if (data.trim() !== '') {
      unobtrusivelyUpdateProtocolDropdown(data)
    } else {
      failGracefully()
    }
  }

  var getFilteredProtocols = function () {
    $.ajax(filterUrl, {
      method: 'GET',
      async: true,
      success: updateProtocolDropdownFromResponse,
      error: function () {},
    })
  }

  if ($('#' + unfilteredId).length > 0) {
    $('#' + unfilteredId).on('focus', function () { this.state = 'open' })
    $('#' + unfilteredId).on('blur', function () { this.state = 'closed' })

    $(getFilteredProtocols)
  }

  return {
    reinsertUpdatedFilteredProtocols: function () {
      replaceProtocolsDropdown()
    },

    updateDisplayedProtocolsList: function (protocolId) {
      alreadyDisplayedProtocols.push(protocolId)
    },

    resetFilteredProtocolsList: function () {
      unobtrusivelyUpdateProtocolDropdown($('#' + filteredProtocolCacheId).val())
    },

    getFilteredProtocols: function () {
      getFilteredProtocols()
    },

    getAlreadyDisplayedProtocols: function () {
      return alreadyDisplayedProtocols
    },

    resetAlreadyDisplayedProtocols: function (values) {
      alreadyDisplayedProtocols = JSON.parse(values)
    },
  }
}

export function addProtocolToDisplayOptions(protocolDropdown, url) {
  $.ajax(url, {
    method: 'GET',
    async: true,
    dataType: 'script',
    data: {
      protocol_id: protocolDropdown.value,
      search_results_id: $('#search_results_id').val(),
    },
    complete: function () {
      if ($('#display_options_form_submit').data('focus-after-adding-protocol')) {
        $('#display_options_form_submit').focus() // force onblur to be called so we can appropriately update the dropdown
      }
    },
  })
}

$(document).on('change', '.protocol-dropdown', function () {
  if (this.value) {
    addProtocolToDisplayOptions(this, $(this).data('addProtocolUrl'))
  }
})

// searches_helper
$(document).on('ajax:before', '#save_button', function () {
  // this is only used one other place: new search form, which will eventually need to be implemented with event handler
  insertCurrentDisplayOptions()
  $(this).data('params', $('#mine_search_form').serialize())
})

$(document).on('click', '.display-header-toggle', function () {
  toggleHeaderGroupItems($(this))
})

$(document).on('click', '#display_options_link', function () {
  toggleDisplayOptionsForm('display_options')
  $('#search_results').scrollTo()
})

$(document).on('submit', '#mine_search_form', function () {
  window.CDD.History.persistFormState($(this))
  insertCurrentDisplayOptions()
  showProcessingSearchMessage()
})

$(function () {
  initSortableHeaderGroups()
})

_.merge(window.CDD, CDD)
