import * as d3 from 'd3'

if (window.CDD === null) { window.CDD = {} }
let CDD = window.CDD

function toggleNumericReadoutSections(selectedDataType, nonNumericDataTypes) {
  var unitLabelSectionElement = $('.readout-definition-unit')
  var normalizationSectionElement = $('.readout-definition-normalization')
  var displayFormatElement = $('[id^=display_format_readout_definition]')

  if (selectedDataType === '' || _.includes(nonNumericDataTypes, selectedDataType)) {
    unitLabelSectionElement.fadeOut()
    normalizationSectionElement.fadeOut()
    displayFormatElement.fadeOut()
  } else {
    unitLabelSectionElement.fadeIn()
    displayFormatElement.fadeIn()
    if (!$('#readout_definition_protocol_condition').prop('checked')) {
      normalizationSectionElement.fadeIn()
    }
  }
}

function toggleConditions(selectedDataType, nonConditionCompatibleDataType) {
  var condition = $('#condition')

  if (selectedDataType === '' || _.includes(nonConditionCompatibleDataType, selectedDataType)) {
    condition.fadeOut()
    $('#readout_definition_protocol_condition').prop('checked', false)
  } else {
    condition.fadeIn()
  }
}

function togglePickListSections(selectedDataType, nonPickListCompatibleDataType) {
  var pickListDialog = $('.pick_list_readout_definition')

  if (selectedDataType === '' || _.includes(nonPickListCompatibleDataType, selectedDataType)) {
    pickListDialog.fadeOut()
  } else {
    pickListDialog.fadeIn()
  }
}

function toggleNormalizationScope(conditionCheckboxChecked) {
  var form = $(this).closest('form')
  var dataTypeSelect = form.find('.dataType')
  var normalizationRow = $('.readout-definition-normalization')
  if (dataTypeSelect.val() === 'Number') {
    if (conditionCheckboxChecked) {
      $(normalizationRow).fadeOut()
    } else {
      $(normalizationRow).fadeIn()
    }
  }
}

function toggleNormalizationOptions(scope) {
  var form = $(this).closest('form')
  var options = form.find('.normalizations-options')
  var message = form.find('.protocol-readouts-edit-normalization .details, .readout-definition-normalization .details')

  if (scope === '') {
    message.show()
  } else {
    message.hide()
  }

  if (scope === '' || scope === 'already_normalized') {
    options.hide()
    $('#condition').fadeIn()
  } else {
    options.show()
    form.find('.normalizations-menu-scope').val(scope)
    $('#condition').fadeOut()
  }
}

function toggleNormalization() {
  var tr = $(this).closest('tr')
  var nameField = tr.find('.normalized-calculation-name')
  var destroyField = tr.find('.normalizations-menu-destroy')
  var readoutDefinitionNameElt = $("[name='readout_definition[name]']")

  tr.find('.normalization-customizations').toggle()
  if (nameField.is(':visible')) {
    if (nameField.val() === '') {
      nameField.val(readoutDefinitionNameElt.val() + ' ' + tr.find('.normalizations-menu-option label:first').html())
    }
    nameField.focus()
    // also select all text
  }
  destroyField.val(!($(this).prop('checked')))
}

function toggleSubtractNormalizedValues() {
  var checked = $(this).prop('checked')
  $('.invert-normalized-value').prop('checked', checked).val(checked)
}

function toggleMinimumInactivity(selectedOption, upperActivityElt) {
  if (selectedOption === 'from') {
    upperActivityElt.show()
  } else {
    upperActivityElt.hide()
    upperActivityElt.find('input').prop('value', '')
  }
}

function destroyNumericCalculationsIfNecessary(form, nonNumericDataTypes, dataTypeSelect, scopeSelect) {
  var selectedDataType = dataTypeSelect.find('option:selected').val()
  var selectedScope = scopeSelect.find('option:selected').val()

  if (selectedDataType === '' || _.includes(nonNumericDataTypes, selectedDataType) || selectedScope === '') {
    $(form).find('.normalizations-menu-destroy').val(true)
  }
}

// eslint-disable-next-line no-unused-vars
window.showNewReadoutDefinitionForm = function () {
  $('#protocol-readouts-show').hide()
  $('#protocol-readouts-edit').show()
}

function disableReadoutDefinitionEditLinks() {
  $('.readoutDefinitionEditLink').each(function () {
    var editLink = this
    editLink.onclickWas = editLink.onclick
    editLink.onclick = 'return false;'
  })
}

function reEnableReadoutDefinitionEditLinks() {
  $('.readoutDefinitionEditLink').each(function () {
    var editLink = this
    editLink.onclick = editLink.onclickWas
  })
}

CDD.DoseResponseForm = {
  selectCalculation: function (select) {
    select = $(select)
    var selectedType = select.find('option:selected').text()

    var customFields = select.nextAll('.customFields:first')
    var name = customFields.find('.customName')
    var intersect = customFields.find('.customIntersect')

    if (selectedType == 'Custom...') {
      customFields.show()
      name.val('')
      intersect.val('')
      name.focus()
    } else {
      customFields.hide()
      if (selectedType == '- Select -') {
        name.val('')
        intersect.val('')
      } else {
        name.val(selectedType)
        intersect.val(selectedType.replace(/\D+/g, ''))
      }
    }
  },

  setNormalizationOptions: function () {
    var form = $(this).closest('form')

    var scope = $('#dose_response_calculation_normalization_option').val()
    var options = form.find('.normalizations-options')
    var message = form.find('.normalizations-message')
    var cdd_normalized = !(scope === '' || scope === 'already_normalized')
    var type_is_inhibition = ($('#dose_response_calculation_normalization_calculation_type').val() === '% inhibition or activation') && cdd_normalized
    var type_is_negative = ($('#dose_response_calculation_normalization_calculation_type').val() === '% negative control') && cdd_normalized;

    // Display the "controls improve the accuracy..." message only if they have chosen not to normalize
    (scope === '' || scope === 'already_normalized') ? message.show() : message.hide()

    $('#dose_response_calculation_percent_inhibition_destroy').val(!type_is_inhibition)
    $('#dose_response_calculation_percent_negative_destroy').val(!type_is_negative)

    if (type_is_inhibition) {
      form.find('tr.percent_inhibition').show()
    } else {
      form.find('tr.percent_inhibition').hide()
    }

    if (type_is_negative) {
      form.find('tr.percent_negative').show()
    } else {
      form.find('tr.percent_negative').hide()
    }

    if (!cdd_normalized) {
      options.hide()
    } else {
      options.show()
      form.find('.normalization-scope').val(scope)
    }
  },

  toggleMinimumActivityUnit: function (minimumActivityUnitTextElement, scope, nonnormalizedUnit) {
    if (scope === '' || scope == 'already_normalized') {
      if (nonnormalizedUnit !== '') {
        nonnormalizedUnit = '(' + nonnormalizedUnit + ')'
      }
      minimumActivityUnitTextElement.text(nonnormalizedUnit)
      $('#customized_minimum_activity').click()
      $('#default_minimum_activity').prop('disabled', true)
      $('#default_minimum_activity_text').addClass('disabled')
    } else {
      minimumActivityUnitTextElement.text('(%)')
      if ($('#default_minimum_activity').prop('disabled') === true) {
        $('#default_minimum_activity').prop('disabled', false)
        $('#default_minimum_activity_text').removeClass('disabled')
      }
    }
  },

  setMinimumActivityUnit: function (minimumActivityUnitTextElement, value, normalizationDropdown) {
    var scope = $('#' + normalizationDropdown).val()
    if (scope === '' || scope == 'already_normalized') {
      if (value !== '') { value = '(' + value + ')' }
      minimumActivityUnitTextElement.text(value)
    }
  },
}

CDD.RocPlot = (function () {
  function areaUnderCurve(points) {
    var sum = 0
    points.forEach(function (point, i) { // forEach not available on IE8, but neither is SVG so no problemo
      var x1 = point[0], y1 = point[1], nextPoint = points[i + 1]
      if (nextPoint) {
        sum += (nextPoint[0] - x1) * ((y1 + nextPoint[1]) / 2.0)
      }
    })
    return sum
  }

  function drawPlot(containerId, json) {
    var points = json.roc_points

    var bisectFPR = d3.bisector(function (d) { return d[0] }).left,
      formatValue = d3.format(',.2f')

    var containerWidth = 610,
      containerHeight = 630,
      margin = { top: 38, right: 18, bottom: 60, left: 60 },
      width = containerWidth - margin.left - margin.right,
      height = containerHeight - margin.top - margin.bottom

    var svg = d3.select('#' + containerId).append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('id', 'rocSVG')
    // .attr("shape-rendering", "crispEdges")
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g') // everything we add to the svg will go in a group that translates it according to the margins
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    var x = d3.scale.linear().domain([0, 1]).range([0, width])
    // SVG coordinate space has y increasing from top to bottom, hence the backwards domain
    var y = d3.scale.linear().domain([1, 0]).range([0, height])

    // Our data arrives as an array of x,y pairs, this is a function to extract x and y.
    var line = d3.svg.line()
      .x(function (d) { return x(d[0]) })
      .y(function (d) { return y(d[1]) })

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .ticks(5)
      .tickPadding(9)
      .tickSize(-height)

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .ticks(5)
      .tickPadding(9)
      .tickSize(-width)

    // The background for the chart area
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis)

    svg.append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .text('False-positive rate')

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)

    svg.append('text')
      .attr('class', 'y label')
      .attr('text-anchor', 'middle')
      .attr('x', -38)
      .attr('y', height / 2)
      // The second two coordinates are the center of rotation, and should be kept in sync with x and y
      .attr('transform', 'rotate(-90,' + -38 + ',' + height / 2 + ')')
      .text('True-positive rate')

    svg.append('path')
      .attr('id', 'rocDiagonal')
      .attr('stroke-dasharray', '8,8')
      .attr('d', line([[0, 0], [1, 1]]))

    var auc = svg.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', 3 * height / 5 - 1)

    auc.append('tspan')
      .text('Area under ROC curve: ')

    auc.append('tspan')
      .attr('class', 'bold')
      .text(formatValue(areaUnderCurve(points)))

    svg.append('text')
      .attr('class', 'label bold')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', -10)
      .text('Stratified ' + json.validation_fold_count + '-Fold Cross-Validation')

    var path = svg.append('path')
      .attr('id', 'rocPath')
      .attr('d', line(points))

    // **********************
    // This animates 'unrolling' the line, by starting with a stroke-dasharray and
    // stroke-dashoffset that hide the entire line.

    var totalLength = path.node().getTotalLength()

    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2500)
      .ease('linear')
      .attr('stroke-dashoffset', 0)

    // **********************
    // Display sensitivity and specificity on mouseover (actually mousemove)

    var focus = svg.append('g')
      .attr('class', 'focus')
      .style('display', 'none')

    focus.append('rect')
      // move it over enough so that it won't cover the line
      .attr('x', 2)
      .attr('y', 2)
      .attr('class', 'focusBackground')
      .attr('width', '10.5em')
      .attr('height', '4.6em')

    var focusTextX = 8,
      focusTextDy = '1.4em',
      crossOuter = 16,
      crossInner = 2,
      unscaledLine = d3.svg.line()
        .x(function (d) { return d[0] })
        .y(function (d) { return d[1] })

    focus.append('path')
      .attr('class', 'focusCrossHair')
      .attr('d', unscaledLine([[0, -crossOuter], [0, -crossInner]])) // top
    focus.append('path')
      .attr('class', 'focusCrossHair')
      .attr('d', unscaledLine([[0, crossOuter], [0, crossInner]])) // bottom
    focus.append('path')
      .attr('class', 'focusCrossHair')
      .attr('d', unscaledLine([[-crossOuter, 0], [-crossInner, 0]])) // right
    focus.append('path')
      .attr('class', 'focusCrossHair')
      .attr('d', unscaledLine([[crossOuter, 0], [crossInner, 0]])) // left

    var focusText = focus.append('text')

    // In order to mimic newlines we need to add tspans
    // with increasing "dy"
    focusText.append('tspan')
      .attr('class', 'sensitivity')
      .attr('x', focusTextX)
      .attr('dy', focusTextDy)

    focusText.append('tspan')
      .attr('class', 'specificity')
      .attr('x', focusTextX)
      .attr('dy', focusTextDy)

    focusText.append('tspan')
      .attr('class', 'cutoff')
      .attr('x', focusTextX)
      .attr('dy', focusTextDy)

    function mousemove() {
      var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectFPR(points, x0, 1),
        d0 = points[i - 1],
        d1 = points[i],
        d = x0 - d0[0] > d1[0] - x0 ? d1 : d0
      focus.attr('transform', 'translate(' + x(d[0]) + ',' + y(d[1]) + ')')
      focus.select('.sensitivity').text('Sensitivity: ' + formatValue(d[1]))
      focus.select('.specificity').text('Specificity: ' + formatValue(1 - d[0]))
      focus.select('.cutoff').text('Score cutoff: > ' + formatValue(d[2]))
    }

    svg.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .on('mouseover', function () { focus.style('display', null) })
      .on('mouseout', function () { focus.style('display', 'none') })
      .on('mousemove', mousemove)
  }

  function waitForPlotPoints() {
    var containerId = 'rocPlot'
    if ($('#' + containerId).length === 0) { // this can be called on protocol pages that aren't machine learning protocols
      return
    }
    d3.json($('#' + containerId).attr('data-roc_points_url'), function (error, json) {
      if (error) {
        throw error
      }
      if (json && json.roc_points) {
        $('#rocPlotLoading').hide()
        drawPlot(containerId, json)
      } else {
        setTimeout(waitForPlotPoints, 2000)
      }
    })
  }

  $(waitForPlotPoints)
}())

$('.readoutDefinitionEditLink').on('ajax:before', function () {
  disableReadoutDefinitionEditLinks()
}).on('ajax:complete', function () {
  reEnableReadoutDefinitionEditLinks()
})

$(document).on('click', ".normalizations-menu-checkbox input[type='checkbox']", function () {
  toggleNormalization.call(this)
})

$(document).on('click', '.invert-normalized-values', function () {
  toggleSubtractNormalizedValues.call(this)
})

$(document).on('change', '.normalizations-scope', function () {
  toggleNormalizationOptions.call(this, $(this).val())
})

$(document).on('change', 'select.dataType', function () {
  var selectedValue = $(this).find('option:selected').val()
  toggleNumericReadoutSections(selectedValue, $(this).data('nonNumericDataTypes'))
  toggleConditions(selectedValue, $(this).data('nonConditionCompatibleDataTypes'))
  togglePickListSections(selectedValue, $(this).data('nonPickListDataTypes'))
})

$(document).on('click', '#readout_definition_protocol_condition', function () {
  toggleNormalizationScope.call(this, $(this).prop('checked'))
})

$(document).on('change', '#dose_response_calculation_minimum_inactivity_modifier', function () {
  toggleMinimumInactivity($(this).find('option:selected').html(), $('.inactivity-upper-bound'))
})

$(document).on('click', '.buttony[data-confirmation-message].readout-definition-submit', function (event) {
  var protocolConditionInitially = $(this).data('protocolCondition')
  var protocolConditionChecked = $('#readout_definition_protocol_condition').prop('checked')
  var confirmationMessage = $(this).data('confirmationMessage')

  var initiallyOrChecked = (protocolConditionInitially && !protocolConditionChecked) || (!protocolConditionInitially && protocolConditionChecked)

  if (initiallyOrChecked && !window.confirm(confirmationMessage)) {
    event.stopImmediatePropagation()
    event.preventDefault()
    return false
  }

  var form = $(this).closest('form')
  var dataType = form.find('.dataType')
  var scope = form.find('.normalizations-scope')
  destroyNumericCalculationsIfNecessary(form, dataType.data('nonNumericDataTypes'), dataType, scope)
})
