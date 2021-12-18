import { Terminology } from 'javascripts/cross_app_utilities.js'

export function AutoFormulaFunction(functionName, argumentList, descriptionText, aggregationType, differentProtocol, protocolCondition, protocolId, shortName, numericOutputReadoutRowClass) {
  this.functionName = functionName
  this.argumentList = argumentList || ''
  this.descriptionText = descriptionText || ''
  this.aggregationType = aggregationType || null
  this.differentProtocol = differentProtocol || false
  this.protocolCondition = protocolCondition || false
  this.protocolId = protocolId || null
  this.shortName = shortName || null
  this.numericOutputReadoutRowClass = numericOutputReadoutRowClass || ''
  this.identifier = null
}

AutoFormulaFunction.prototype.functionNameForMatching = function () {
  return this.functionName
}

AutoFormulaFunction.prototype.functionNameForDisplay = function () {
  return this.functionName
}

AutoFormulaFunction.prototype.functionNameWithParentheses = function () {
  return this.functionName + '()'
}

AutoFormulaFunction.prototype.functionNameWithArgumentList = function () {
  return this.functionName + '(' + '<i>' + this.argumentList + '</i>' + ')'
}

AutoFormulaFunction.prototype.escapeBrackets = function (functionName) {
  return functionName.replace(/\\\[/g, '[').replace(/\\\]/g, ']')
}

AutoFormulaFunction.prototype.functionNameForListItem = function (elem, entry) {
  var functionNameForDisplay = this.functionNameForDisplay()
  return this.escapeBrackets('<strong>' + functionNameForDisplay.unescapeHTML().substr(0, entry.length).escapeHTML() + '</strong>' + functionNameForDisplay.unescapeHTML().substr(entry.length).escapeHTML())
}

AutoFormulaFunction.prototype.functionNameForListItemForPartialMatch = function (elem, entry, foundPos) {
  var functionNameForDisplay = this.functionNameForDisplay()
  return this.escapeBrackets(functionNameForDisplay.unescapeHTML().substr(0, foundPos).escapeHTML() + '<strong>' + functionNameForDisplay.unescapeHTML().substr(foundPos, entry.length).escapeHTML() + '</strong>' + functionNameForDisplay.unescapeHTML().substr(foundPos + entry.length).escapeHTML())
}

AutoFormulaFunction.prototype.functionIdentiferForListItem = function () {
  return "<div class='identifier' style='display: none'>" + this.identifier + '<div>'
}

AutoFormulaFunction.prototype.functionInformationForListItem = function () {
  return "<div class='descriptionText'>" + this.descriptionText + '</div>' +
          "<div class='argumentList'>" + this.functionNameWithArgumentList() + '</div>' +
          this.functionIdentiferForListItem() + '</li>'
}

AutoFormulaFunction.prototype.createListItem = function (elem, entry, functionNameText) {
  functionNameText = functionNameText || this.functionNameForListItem(elem, entry)
  return "<li><div class='functionName functionNameNarrow'>" + functionNameText + '</div>' + this.functionInformationForListItem()
}

AutoFormulaFunction.prototype.createListItemForPartialMatch = function (elem, entry, foundPos, ignoreCase) {
  return this.createListItem(elem, entry, this.functionNameForListItemForPartialMatch(elem, entry, foundPos, ignoreCase))
}

// we are adding functions for the simple case of introspection (what kind of thing am i?) surely this is an antipattern.
// a "bracket function" (couldn't come up with a better name) is either a readout definition or a property, i.e. [] or {}
function AutoFormulaBracketFunction(functionName, argumentList, descriptionText, aggregationType, differentProtocol, protocolCondition, protocolId, shortName, numericOutputReadoutRowClass) {
  AutoFormulaFunction.call(this, functionName, argumentList, descriptionText, aggregationType, differentProtocol, protocolCondition, protocolId, shortName, numericOutputReadoutRowClass)
}

AutoFormulaBracketFunction.prototype = Object.create(AutoFormulaFunction.prototype)

AutoFormulaBracketFunction.prototype.unitForListItem = function () {
  return this.descriptionText.length > 0 ? ' (' + this.descriptionText + ')' : ''
}

AutoFormulaBracketFunction.prototype.constructor = AutoFormulaBracketFunction

export function AutoFormulaReadoutDefinition(functionName, argumentList, descriptionText, aggregationType, differentProtocol, protocolCondition, protocolId, shortName, numericOutputReadoutRowClass) {
  AutoFormulaBracketFunction.call(this, functionName, argumentList, descriptionText, aggregationType, differentProtocol, protocolCondition, protocolId, shortName, numericOutputReadoutRowClass)
}

AutoFormulaReadoutDefinition.prototype = Object.create(AutoFormulaBracketFunction.prototype)

AutoFormulaReadoutDefinition.prototype.functionNameWithParentheses = function () {
  return this.functionNameForMatching()
}

AutoFormulaReadoutDefinition.prototype.functionNameWidth = function (element) {
  return textMeasurer.width(this.functionNameForDisplay(), $(element))
}

AutoFormulaReadoutDefinition.prototype.functionNameForMatching = function () {
  return (this.functionName.match(/^<span/) ? this.functionName.match(/title="(.*?)"/)[1] : this.functionName).unescapeHTML()
}

AutoFormulaReadoutDefinition.prototype.functionNameForDisplay = function () {
  return (this.functionName.match(/^<span/) ? this.functionName.match(/>(.*?)<\/span>/)[1] : this.functionName)
}

AutoFormulaReadoutDefinition.prototype.functionNameMatches = function (readoutDefinition) {
  // Remove any extra whitespace before matching
  var readoutDefinitionParts = readoutDefinition.split(/(\s|->)/).filter(function (string) { return $.trim(string).length > 0 }),
    readoutDefinitionToMatch = readoutDefinitionParts.join(' ')
  return this.functionNameForMatching() == readoutDefinitionToMatch
}

AutoFormulaReadoutDefinition.prototype.addMarkedUpFunctionName = function (elem, markedUpFunctionName) {
  if (elem.match(/^<span/)) {
    var stringToReplace = elem.match(/>(.*?)<\/span>/)[1]
    return elem.replace(stringToReplace, markedUpFunctionName)
  } else {
    return markedUpFunctionName
  }
}

AutoFormulaReadoutDefinition.prototype.readoutDefinitionNameForListItem = function (elem, entry) {
  var markedUpFunctionName = this.functionNameForListItem(elem, entry)
  return this.addMarkedUpFunctionName(elem, markedUpFunctionName)
}

AutoFormulaReadoutDefinition.prototype.readoutDefinitionNameForListItemForPartialMatch = function (elem, entry, foundPos, ignoreCase) {
  const functionNameForDisplay = this.functionNameForDisplay()
  let markedUpFunctionName
  const truncatedPosition = ignoreCase
    ? functionNameForDisplay.toLowerCase().indexOf(entry.escapeHTML().toLowerCase())
    : functionNameForDisplay.indexOf(entry.escapeHTML())
  if (truncatedPosition == -1) {
    // The typed entry matches a part not in the truncated name but in the full name. In this case we don't want to add markup.
    markedUpFunctionName = functionNameForDisplay
  } else {
    markedUpFunctionName = this.functionNameForListItemForPartialMatch(elem, entry, foundPos)
  }
  return this.addMarkedUpFunctionName(elem, markedUpFunctionName)
}

AutoFormulaReadoutDefinition.prototype.unitForListItem = function () {
  return this.descriptionText.length > 0 ? ' (' + this.descriptionText + ')' : ''
}

AutoFormulaReadoutDefinition.prototype.createListItem = function (elem, entry, functionNameText) {
  functionNameText = functionNameText || this.readoutDefinitionNameForListItem(elem, entry)
  return "<li><div class='functionName'>" + functionNameText + this.unitForListItem() + '</div>' + this.functionIdentiferForListItem() + '</li>'
}

AutoFormulaReadoutDefinition.prototype.createListItemForPartialMatch = function (elem, entry, foundPos, ignoreCase) {
  return this.createListItem(elem, entry, this.readoutDefinitionNameForListItemForPartialMatch(elem, entry, foundPos, ignoreCase))
}

AutoFormulaReadoutDefinition.prototype.forceAggregation = function () {
  return this.differentProtocol && (this.numericOutputReadoutRowClass == 'DetailRow' || this.numericOutputReadoutRowClass == 'BatchRunAggregateRow') // Aggregation type is alway null unless aggregation should be forced
}

AutoFormulaReadoutDefinition.prototype.constructor = AutoFormulaReadoutDefinition

export function AutoFormulaProperty(functionName, argumentList, descriptionText, aggregationType, differentProtocol) {
  AutoFormulaBracketFunction.call(this, functionName, argumentList, descriptionText, aggregationType, differentProtocol)
}

AutoFormulaProperty.prototype = Object.create(AutoFormulaBracketFunction.prototype)

AutoFormulaProperty.prototype.functionNameWithParentheses = function () {
  return this.functionName
}

AutoFormulaProperty.prototype.createListItem = function (elem, entry, functionNameText) {
  functionNameText = functionNameText || this.functionNameForListItem(elem, entry)
  return "<li><div class='functionName'>" + functionNameText + this.unitForListItem() + '</div>' + this.functionIdentiferForListItem() + '</li>'
}

AutoFormulaProperty.prototype.constructor = AutoFormulaProperty

function AutoFormula(element, update, aggregation, options) {
  this.element = element
  this.update = update
  this.aggregation = aggregation
  this.aggregationSelect = this.aggregation.find('select:first')
  this.hasFocus = false
  this.changed = false
  this.active = false
  this.index = 0
  this.entryCount = 0
  this.displayLimit = 100

  this.aggregationDropdown = this.aggregation.find('*:nth-child(2) > *:first-child') // childElements()[1].childElements()[0];
  this.batchRunText = ''

  this.functionNames = []
  this.hashedFunctionNames = {}
  this.addAutoFormulaFunctions(options.functions || [])
  this.addAutoFormulaReadoutDefinitions(options.readoutDefinitions || [])
  this.addAutoFormulaProperties(options.properties || [])
  this.batchRunValue = options.batchRunValue

  this.ensureAggregationDisplayStatus()

  this.setOptions(options)

  this.options.functionNames = this.functionNames
  this.options.hashedFunctionNames = this.hashedFunctionNames
  this.options.numericReadoutDefinitions = this.options.functionNames.filter(function (f) { return (f instanceof AutoFormulaReadoutDefinition && f.numericOutputReadoutRowClass !== '') })
  this.options.conditionDefinitions = this.options.functionNames.filter(function (f) { return (f instanceof AutoFormulaReadoutDefinition && f.protocolCondition) })
  this.options.chemicalProperties = this.options.functionNames.filter(function (f) { return f instanceof AutoFormulaProperty })
  this.options.mathFunctions = this.options.functionNames.filter(function (f) { return !(f instanceof AutoFormulaProperty) && !(f instanceof AutoFormulaReadoutDefinition) })

  var elementToBaseTextMeasurementOn = this.update
  var longestReadoutDefinitionByName,
    currentLongestNameLength = 0
  this.options.numericReadoutDefinitions.forEach(function (definition) {
    if (definition.functionNameForDisplay().length > currentLongestNameLength) {
      longestReadoutDefinitionByName = definition
    }
    currentLongestNameLength = definition.functionNameForDisplay().length
  })
  // PERFORMANCE: Assume the longest readout definition name will have the maximum width
  // Unfortunately not guaranteed to be true, but hopefully good enough
  this.functionNameMaxWidth = longestReadoutDefinitionByName.functionNameWidth(elementToBaseTextMeasurementOn)
  this.update.width(this.element.innerWidth())
  this.originalWidth = this.update.width()
  var offsetLeft = this.originalWidth - this.functionNameMaxWidth
  this.offsetLeft = offsetLeft < 0 ? offsetLeft : 0
  this.hiding = false

  this.options.paramName = this.options.paramName || this.element.name
  this.options.tokens = this.options.tokens || [' ', '(', ')', '*', '/', '÷', '+', '-', '^'] // TODO: Hardcoded
  this.options.frequency = this.options.frequency || 0.4
  this.options.minChars = this.options.minChars || 1

  if (typeof (this.options.tokens) == 'string') {
    this.options.tokens = new Array(this.options.tokens)
  }
  // Force carriage returns as token delimiters anyway
  if (!this.options.tokens.some(function (token) { return token == '\n' })) {
    this.options.tokens.push('\n')
  }

  this.observer = null

  this.element.attr('autocomplete', 'off')

  $(this.update).hide()

  this.clickedOutside = false
  this.element.on('blur', this.onBlur.bind(this))
  this.element.on('keydown', this.onKeyDown.bind(this))
  this.element.on('keyup', this.ensureAggregationDisplayStatus.bind(this))
  $(document).on('click', this.documentOnClick.bind(this))
}

AutoFormula.prototype.show = function () {
  if (this.update.is(':hidden')) {
    if (!this.positionSet) {
      var offsetPosition = {
        top: this.element.offset().top + this.element.outerHeight(),
        left: this.element.offset().left,
      }

      if (this.offsetLeft < 0) {
        offsetPosition.left = this.offsetLeft + offsetPosition.left
      }

      this.update.css('position', 'absolute')
      this.update.offset(offsetPosition)
      this.update.width(this.update.width() - this.offsetLeft)
      this.positionSet = true
    }
    this.hiding = false
    this.update.fadeIn(150)
  }
  // Note:: $.browser.msie returns undefined for IE11+ :)
  if (!this.iefix && $.browser.msie && this.positionSet) {
    this.update.after(
      '<iframe id="' + this.update.attr('id') + '_iefix" ' +
      'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
      'src="javascript:false;" frameborder="0" scrolling="no"></iframe>')
    this.iefix = $('#' + this.update.attr('id') + '_iefix')
  }
  if (this.iefix) {
    setTimeout(this.fixIEOverlapping.bind(this), 50)
  }
}

AutoFormula.prototype.fixIEOverlapping = function () {
  var offset = this.update.offset()
  this.iefix.offset(offset)
  this.iefix.css('z-index', 1)
  this.update.css('z-index', 2)
  $(this.iefix).show()
}

AutoFormula.prototype.hide = function () {
  this.hiding = true
  if (this.update.is(':visible')) {
    this.update.fadeOut(150, function () {
      this.hiding = false
    }.bind(this))
  }
  if (this.iefix) {
    $(this.iefix).hide()
  }
}

AutoFormula.prototype.onKeyDown = function (event) {
  if (event.shiftKey && event.keyCode == $.ui.keyCode.COMMA) {
    var readoutDefinition = this.readoutDefinitionForName(this.precedingReadoutDefinitionName())
    if (readoutDefinition) {
      var protocolConditions = this.protocolConditionsForProtocolId(readoutDefinition.protocolId)
      if (protocolConditions.length > 0) {
        this.updateElementWithProtocolConditions(readoutDefinition, protocolConditions)
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }
  } else if (this.active && !this.hiding) {
    /* eslint-disable no-fallthrough */
    switch (event.keyCode || event.which) {
      case $.ui.keyCode.TAB:
      case $.ui.keyCode.ENTER:
        this.selectEntry()
        event.stopImmediatePropagation()
        event.preventDefault()
      case $.ui.keyCode.ESCAPE:
        this.hide()
        this.active = false
        event.stopImmediatePropagation()
        event.preventDefault()
        return
      // case $.ui.keyCode.LEFT:
      // case $.ui.keyCode.RIGHT:
      //   return;
      case $.ui.keyCode.UP:
        this.markPrevious()
        this.render()
        event.stopImmediatePropagation()
        event.preventDefault()
        return
      case $.ui.keyCode.DOWN:
        this.markNext()
        this.render()
        event.stopImmediatePropagation()
        event.preventDefault()
        return
    }
    /* eslint-enable no-fallthrough */
  } else if (event.keyCode == $.ui.keyCode.ENTER || event.keyCode == $.ui.keyCode.TAB || ($.browser.webkit > 0 && event.keyCode == 0)) {
    return
  }

  this.changed = true
  this.hasFocus = true

  if (this.observer) {
    clearTimeout(this.observer)
  }
  this.observer = setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000)
}

AutoFormula.prototype.readoutDefinitionForName = function (readoutDefinitionName) {
  if (!readoutDefinitionName) {
    return
  }
  return _.find(this.options.numericReadoutDefinitions, function (readoutDefinition) {
    return readoutDefinition.functionNameForMatching() === readoutDefinitionName
  })
}

AutoFormula.prototype.protocolConditionsForProtocolId = function (protocolId) {
  return this.options.conditionDefinitions.filter(function (conditionDefinition) {
    return conditionDefinition.protocolId === protocolId
  })
}

AutoFormula.prototype.formatProtocolConditions = function (readoutDefinitions) {
  var protocolConditions = readoutDefinitions.filter(function (readoutDefinition) {
    return readoutDefinition.protocolCondition
  })
  if (protocolConditions.length > 0) {
    return '<' + protocolConditions.sort(function (protocolConditionA, protocolConditionB) {
      return protocolConditionA.functionName
        .localeCompare(protocolConditionB.functionName)
    }).map(function (protocolCondition) {
      return '[' + protocolCondition.shortName + ']=""'
    }).join(',') + '>'
  } else {
    return null
  }
}

AutoFormula.prototype.precedingReadoutDefinitionName = function () {
  var upToCaret = this.element.val().substring(0, this.getCaretPosition())

  var closingBracketIndex = upToCaret.search(/\]\s*$/)
  if (closingBracketIndex <= 0 || upToCaret[closingBracketIndex - 1] == '\\') {
    return null
  }
  var openingBracketIndex = closingBracketIndex
  do {
    openingBracketIndex = upToCaret.lastIndexOf('[', openingBracketIndex - 1)
  } while (openingBracketIndex > 0 && upToCaret[openingBracketIndex - 1] == '\\')
  if (openingBracketIndex < 0) {
    return null
  }

  return upToCaret.substring(openingBracketIndex + 1, closingBracketIndex)
}

AutoFormula.prototype.ensureAggregationDisplayStatus = function (event) {
  if (this.currentFormulaHasAggregation(this.element.val()) === true) {
    this.aggregationDropdown.attr('disabled', false)
    if (this.currentFormulaContainsAggregationsFromDifferentProtocol(this.element.val())) {
      this.removeBatchRunOption()
    } else {
      this.addBatchRunOption()
    }
    $(this.aggregation).show()
  } else {
    this.aggregationDropdown.val('batch and run')
    $(this.aggregation).hide()
    this.aggregationDropdown.attr('disabled', true)
  }
}

AutoFormula.prototype.currentFormulaHasAggregation = function (string) {
  var aggregationPattern = RegExp(this.aggregationFunctionNamesPattern, 'i')
  var match = string.match(aggregationPattern)
  if (match === null) {
    return false
  }

  while (match !== null) {
    var matchStartIndex = string.indexOf(match[0])
    if (matchStartIndex === 0) {
      return true
    } else {
      var checkedString = string.substring(0, matchStartIndex)
    }
    var truthiness = this.stringHasMatchedOpenBracket(checkedString)
    if (truthiness === true) {
      return truthiness
    }
    string = string.substring((checkedString.length + match[0].length), (string.length - 1))
    match = string.match(aggregationPattern)
  }
}

AutoFormula.prototype.stringHasMatchedOpenBracket = function (checkedString) {
  var openingBracketIndex = checkedString.lastIndexOf('[')
  var closingBracketIndex = checkedString.lastIndexOf(']')

  if (openingBracketIndex === -1 && closingBracketIndex === -1) {
    // No matching brackets
    return true
  } else if (openingBracketIndex !== -1 && closingBracketIndex === -1) {
    // No closing bracket in string
    return false
  } else if (closingBracketIndex < openingBracketIndex) {
    // No matching closing bracket
    return false
  } else {
    // ???
    return true
  }
}

AutoFormula.prototype.currentFormulaContainsAggregationsFromDifferentProtocol = function (string) {
  var aggregationPattern = RegExp(this.aggregationFunctionNamesPattern + '\\s*\\[((.+?)[^\\\\])\\]', 'i')
  var match = string.match(aggregationPattern)

  while (match !== null) {
    var readoutDefinitionName = match[2].trim()
    var matchStartIndex = string.indexOf(match[0])
    if (this.functionNames.some(function (f) {
      return (f instanceof AutoFormulaReadoutDefinition) && f.functionNameMatches(readoutDefinitionName) && f.differentProtocol
    })) {
      return true
    }
    var checkedString = string.substring(0, matchStartIndex)
    string = string.substring((checkedString.length + match[0].length), (string.length - 1))
    match = string.match(aggregationPattern)
  }

  return false
}

AutoFormula.prototype.removeBatchRunOption = function () {
  var options = $('#' + this.aggregation.attr('id') + ' select option')
  options.each(function (index, element) {
    if ($(element).val() == this.batchRunValue) {
      this.batchRunText = $(element).html() // We need this when adding the option back
      $(element).remove()
    }
  }.bind(this))

  this.ensureAggregationOptionIsSet()
}

AutoFormula.prototype.addBatchRunOption = function () {
  var batchRunOptionExists = false,
    options = $('#' + this.aggregation.attr('id') + ' select option')

  options.each(function (index, element) {
    if ($(element).val() == this.batchRunValue) {
      batchRunOptionExists = true
    }
  }.bind(this))

  if (!batchRunOptionExists) {
    this.aggregationSelect.prepend("<option value='" + this.batchRunValue + "'>" + this.batchRunText + '</option>')
    this.aggregationSelect[0].selectedIndex = 0
  }
  this.ensureAggregationOptionIsSet()
}

AutoFormula.prototype.ensureAggregationOptionIsSet = function () {
  // selectedIndex can occasionally be set to -1 after the batch/run option has been removed (which results in a blank option)
  if (this.aggregationSelect[0].selectedIndex < 0) {
    this.aggregationSelect[0].selectedIndex = 0
  }
}

AutoFormula.prototype.onHover = function (event) {
  var element = $(event.target).closest('li')
  if (this.index != element[0].autocompleteIndex) {
    this.index = element[0].autocompleteIndex
    this.render()
  }
  event.stopImmediatePropagation()
  event.preventDefault()
  return false
}

AutoFormula.prototype.onClick = function (event) {
  if (!this.hiding) {
    var element = $(event.target).closest('li')
    this.index = element[0].autocompleteIndex
    this.selectEntry()
    this.hide()
    this.ensureAggregationDisplayStatus()
  }
}

AutoFormula.prototype.documentOnClick = function (event) {
  if (this.element.id != event.target.id) {
    this.clickedOutside = true
  }
}

// Defer onBlur to check if we're clicking on the autocompleter scrollbar:
// https://prototype.lighthouseapp.com/projects/8887/tickets/248-results-popup-from-ajaxautocompleter-disappear-when-user-clicks-on-scrollbars-in-ie6ie7
// TODO: Deal with the fact that this doesn't work in IE11 :)
AutoFormula.prototype.onBlur = function (event) {
  // needed to make click events working
  var callback = function () {
    if (this.clickedOutside) {
      this.clickedOutside = false
      this.blurChoices(event)
    } else {
      this.element.focus()
    }
  }.bind(this)
  if (this.active) {
    setTimeout(callback, 200)
  }
}

AutoFormula.prototype.blurChoices = function (event) {
  setTimeout(this.hide.bind(this), 250)
  this.hasFocus = false
  this.active = false
}

AutoFormula.prototype.render = function () {
  if (this.entryCount > 0) {
    for (var i = 0; i < this.entryCount; i++) {
      if (this.index == i) {
        this.getEntry(i).addClass('selected')
      } else {
        this.getEntry(i).removeClass('selected')
      }
    }
    if (this.hasFocus) {
      if (this.entryCount > 15) {
        this.update.height(275)
        this.update.css('overflow-y', 'scroll')
      } else {
        this.update.height('inherit')
        this.update.css('overflow-y', 'inherit')
      }
      this.show()
      this.active = true
    }
  } else {
    this.active = false
    this.hide()
  }
}

AutoFormula.prototype.markPrevious = function () {
  if (this.index > 0) {
    this.index--
  } else {
    this.index = this.entryCount - 1
  }
  this.scrollIntoViewIfNecessary(this.getEntry(this.index))
}

AutoFormula.prototype.markNext = function () {
  if (this.index < this.entryCount - 1) {
    this.index++
  } else {
    this.index = 0
  }
  this.scrollIntoViewIfNecessary(this.getEntry(this.index))
}

AutoFormula.prototype.scrollIntoViewIfNecessary = function (element) {
  if (!this.isElementInViewport(element)) {
    element[0].scrollIntoView(false) // TODO: This sucks, do something less jerky
  }
}

AutoFormula.prototype.isElementInViewport = function (element) {
  var rect = element[0].getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
  )
}

AutoFormula.prototype.getEntry = function (index) {
  return $(this.update.find('> *:first-child > *')[index])
}

AutoFormula.prototype.getCurrentEntry = function () {
  return this.getEntry(this.index)
}

AutoFormula.prototype.extractEntry = function (entry) {
  return this.options.hashedFunctionNames[entry[0].lastChild.firstChild.data]
}

AutoFormula.prototype.selectEntry = function () {
  this.active = false
  this.updateElement(this.extractEntry(this.getCurrentEntry()))
}

// Adapted from http://flightschool.acylt.com/devnotes/caret-position-woes/
AutoFormula.prototype.getCaretPosition = function () {
  var caretPos = 0

  if (document.selection) { // IE Support
    this.element.focus()

    // To get cursor position, get empty selection range
    var selection = document.selection.createRange()

    // Move selection start to 0 position
    selection.moveStart('character', -this.element.val().length)

    // The caret position is selection length
    caretPos = selection.text.length
  } else if (this.element[0].selectionStart || this.element[0].selectionStart == '0') { // Firefox support
    caretPos = this.element[0].selectionStart
  }

  return caretPos
}

AutoFormula.prototype.setCaretPosition = function (caretPos) {
  if (document.selection) { // IE Support
    // Set focus on the element
    this.element.focus()

    // Create empty selection range
    var selection = document.selection.createRange()

    // Move selection start and end to 0 position
    selection.moveStart('character', -this.element.val().length)

    // Move selection start and end to desired position
    selection.moveStart('character', caretPos)
    selection.collapse()
    selection.select()
  } else if (this.element[0].selectionStart || this.element[0].selectionStart == '0') { // Firefox support
    this.element[0].selectionStart = caretPos
    this.element[0].selectionEnd = caretPos
    this.element.focus()
  }
}

AutoFormula.prototype.updateChoices = function ({ choices, moreResultsThanDisplayed }) {
  if (!this.changed && this.hasFocus) {
    this.update.html(choices) // choices is already escaped
    this.update.toggleClass('truncated', moreResultsThanDisplayed)

    if (this.update.find('> *:first-child > *').length > 0) {
      this.entryCount = this.update.find('> *:first-child > *').length
      for (var i = 0; i < this.entryCount; i++) {
        var entry = this.getEntry(i)
        entry[0].autocompleteIndex = i
        this.addObservers(entry)
      }
    } else {
      this.entryCount = 0
    }

    this.index = 0

    if (this.entryCount == 1 && this.options.autoSelect) {
      this.selectEntry()
      this.hide()
    // we don't want the menu popping up when an entry has already been typed out in full
    } else if (this.entryCount == 1 && (this.getToken() == '[' + this.extractEntry(this.getCurrentEntry()).functionName + ']')) {
      this.hide()
    } else {
      this.render()
    }
  }
}

AutoFormula.prototype.addObservers = function (element) {
  element.on('mouseover', this.onHover.bind(this))
  element.on('click', this.onClick.bind(this))
}

AutoFormula.prototype.onObserverEvent = function () {
  this.changed = false
  this.tokenBounds = null
  if (this.getToken().length >= this.options.minChars) {
    this.getUpdatedChoices()
  } else {
    this.active = false
    this.hide()
  }
}

AutoFormula.prototype.forceAggregationIfNeeded = function (autoFormulaFunction, value, forProtocolCondition) {
  var aggregationTypes = ['average', 'avg', 'geomean']

  if (autoFormulaFunction.forceAggregation() || forProtocolCondition) {
    var substringBeforeTokenBound = this.element.val().substr(0, this.getTokenBounds()[0] - 1)
    var aggregationType = _.find(aggregationTypes, function (aggregationType) { return substringBeforeTokenBound.endsWith(aggregationType) })

    if (aggregationType) {
      // Replace the average type if there already is one to ensure it's correct
      var formulaBeforeAverageType = substringBeforeTokenBound.substring(0, substringBeforeTokenBound.length - aggregationType.length),
        formulaAfterAverageType = this.element.val().substring(this.getTokenBounds()[0] - 1)

      let newCaretPos = this.getCaretPosition() - aggregationType.length + autoFormulaFunction.aggregationType.length
      this.element.val(formulaBeforeAverageType + autoFormulaFunction.aggregationType + formulaAfterAverageType)
      this.setCaretPosition(newCaretPos)

      this.tokenBounds = null

      return value
    } else {
      return autoFormulaFunction.aggregationType + '(' + value + ')'
    }
  } else {
    return value
  }
}

AutoFormula.prototype.updateElementWithProtocolConditions = function (readoutDefinitionFunction, autoFormulaFunction) {
  var caretPos = this.getCaretPosition()
  var bounds = this.getTokenBounds()
  if (caretPos != -1) {
    var value = this.formatProtocolConditions(autoFormulaFunction)
    value = this.forceAggregationIfNeeded(readoutDefinitionFunction, '[' + readoutDefinitionFunction.functionName.unescapeHTML() + ']' + value, true)

    var leadingValue = this.element.val().substr(0, bounds[0])
    var whitespace = this.element.val().substr(0, bounds[0]).match(/^\s+/)
    if (whitespace) {
      leadingValue += whitespace[0]
    }

    var trailingValue = this.element.val().substr(caretPos)
    this.element.val(leadingValue + value + trailingValue) // standardize things before counting characters for caret placement
    this.calculateCaretPositionAfterProtocolConditionUpdate(caretPos)
  }
}

AutoFormula.prototype.calculateCaretPositionAfterProtocolConditionUpdate = function (originalCaretPosition) {
  var firstUnescapedQuote = this.element.val().substr(originalCaretPosition).indexOf('"')
  this.setCaretPosition(originalCaretPosition + firstUnescapedQuote + 1)
}

AutoFormula.prototype.updateElement = function (autoFormulaFunction) {
  if (this.options.updateElement) {
    this.options.updateElement(autoFormulaFunction)
    return
  }
  var value = ''
  value = autoFormulaFunction.functionNameWithParentheses()

  if (this.getToken().startsWith('[')) {
    value = '[' + value + ']'
    value = this.forceAggregationIfNeeded(autoFormulaFunction, value)
  } else if (this.getToken().startsWith('{')) {
    value = '{' + value + '}'
  }

  var bounds = this.getTokenBounds()
  if (bounds[0] != -1) {
    var newValue = this.element.val().substr(0, bounds[0])
    var whitespace = this.element.val().substr(bounds[0]).match(/^\s+/)
    var offset = (autoFormulaFunction instanceof AutoFormulaReadoutDefinition) || (autoFormulaFunction instanceof AutoFormulaProperty) ? 0 : -1

    if (whitespace) {
      newValue += whitespace[0]
    }

    this.element.val(newValue + value + this.element.val().substr(bounds[1]))
    this.setCaretPosition((newValue + value).length + offset)
  } else {
    this.element.val(value)
  }
  this.element.focus()

  if (this.options.afterUpdateElement) {
    this.options.afterUpdateElement(this.element, autoFormulaFunction)
  }
}

AutoFormula.prototype.getToken = function () {
  var bounds = this.getTokenBounds()
  return $.trim(this.element.val().substring(bounds[0], bounds[1]))
}

AutoFormula.prototype.getTokenBounds = function () {
  var value = this.element.val()
  if ($.trim(value).length <= 0) {
    return [-1, 0]
  }
  var caretPos = this.getCaretPosition()
  var prevTokenPos = -1, nextTokenPos = value.length

  var tp
  for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
    tp = value.lastIndexOf(this.options.tokens[index], caretPos - 1)
    if (tp > prevTokenPos) prevTokenPos = tp
    tp = value.indexOf(this.options.tokens[index], caretPos)
    if (tp != -1 && tp < nextTokenPos) nextTokenPos = tp
  }

  this.tokenBounds = [prevTokenPos + 1, nextTokenPos]

  // Special handling for variable names
  this.adjustTokenBoundsForVariable(value, caretPos, '[', ']')
  this.adjustTokenBoundsForVariable(value, caretPos, '{', '}')

  return this.tokenBounds
}

AutoFormula.prototype.adjustTokenBoundsForVariable = function (value, caretPos, startDelimiter, endDelimiter) {
  var closestPreviousOpeningNameDelimiterPos = value.lastIndexOf(startDelimiter, caretPos)
  var closestPreviousClosingNameDelimiterPos = value.lastIndexOf(endDelimiter, caretPos - 1)
  if (closestPreviousOpeningNameDelimiterPos > closestPreviousClosingNameDelimiterPos ||
      closestPreviousClosingNameDelimiterPos == caretPos - 1 && closestPreviousOpeningNameDelimiterPos != -1) {
    this.tokenBounds[0] = closestPreviousOpeningNameDelimiterPos
  }
  var closestNextOpeningNameDelimiterPos = value.indexOf(startDelimiter, caretPos + 1)
  var closestNextClosingNameDelimiterPos = value.indexOf(endDelimiter, caretPos)
  if (closestNextClosingNameDelimiterPos != -1 &&
      (closestNextOpeningNameDelimiterPos == -1 || closestNextClosingNameDelimiterPos < closestNextOpeningNameDelimiterPos)) {
    this.tokenBounds[1] = closestNextClosingNameDelimiterPos + 1
  }
}

AutoFormula.prototype.getUpdatedChoices = function () {
  this.updateChoices(this.options.selector(this, this.displayLimit))
}

AutoFormula.prototype.setOptions = function (options) {
  this.options = {
    partialSearch: true,
    partialChars: 2,
    ignoreCase: true,
    fullSearch: false,
    selector: function (instance, displayLimit) {
      var ret = [] // Beginning matches
      var partial = [] // Inside matches
      var entry = instance.getToken()
      let moreResultsThanDisplayed = false

      var array
      if ((entry || '').startsWith('[')) {
        array = instance.options.numericReadoutDefinitions
        entry = entry.substr(1)
        if (entry.endsWith(']')) {
          entry = entry.substr(0, entry.length - 1)
        }
      } else if (entry.startsWith('{')) {
        array = instance.options.chemicalProperties
        entry = entry.substr(1)
        if (entry.endsWith('}')) {
          entry = entry.substr(0, entry.length - 1)
        }
      } else {
        array = instance.options.mathFunctions
      }

      for (var i = 0; i < array.length; i++) {
        var autoFormulaFunction = array[i]
        var elemForMatching = autoFormulaFunction.functionNameForMatching()
        var elem = autoFormulaFunction.functionName
        var foundPos = instance.options.ignoreCase
          ? elemForMatching.toLowerCase().indexOf(entry.toLowerCase())
          : elemForMatching.indexOf(entry)

        while (foundPos != -1) {
          if (foundPos == 0 && elemForMatching.length != entry.length) {
            ret.push(autoFormulaFunction.createListItem(elem, entry))
            break
          } else if (entry.length >= instance.options.partialChars &&
            instance.options.partialSearch && foundPos != -1) {
            if (instance.options.fullSearch || /\s/.test(elemForMatching.substr(foundPos - 1, 1))) {
              partial.push(autoFormulaFunction.createListItemForPartialMatch(elem, entry, foundPos, instance.options.ignoreCase))
              break
            }
          }

          foundPos = instance.options.ignoreCase
            ? elem.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1)
            : elem.indexOf(entry, foundPos + 1)
        }
        if ((partial.length + ret.length) == displayLimit + 1) {
          moreResultsThanDisplayed = true
          break
        }
      }

      if (partial.length) { ret = ret.concat(partial) }
      if (moreResultsThanDisplayed) { ret.pop() }

      return {
        choices: '<ul>' + ret.join('') + '</ul>',
        moreResultsThanDisplayed,
      }
    },
  }
  $.extend(this.options, options || {})
}

AutoFormula.prototype.addAutoFormulaProperties = function (properties) {
  properties.forEach(function (propertyAttributes) {
    var name = propertyAttributes.name, unit = null,
      matches = name.match(/^(.*?) \((.*?)\)/)
    if (matches !== null) {
      name = matches[1]
      unit = matches[2]
    }
    var autoFormulaFunction = new AutoFormulaProperty(name, '', unit)
    this.addAutoFormulaFunction(autoFormulaFunction)
  }.bind(this))
}

AutoFormula.prototype.addAutoFormulaFunction = function (autoFormulaFunction) {
  var index = this.functionNames.length
  this.functionNames.push(autoFormulaFunction)
  this.hashedFunctionNames[index.toString()] = autoFormulaFunction
  autoFormulaFunction.identifier = index.toString()

  if (autoFormulaFunction.argumentList == Terminology.t('readout_definition')) {
    var aggregationFunctionNames = this.functionNames.filter(function (fn) {
      return fn.argumentList == Terminology.t('readout_definition')
    }).map(function (fn) {
      return fn.functionName
    })
    this.aggregationFunctionNamesPattern = '(' + aggregationFunctionNames.join('|') + ')\\s*\\(' // allow both 'average(' and 'average ('
  }
}

AutoFormula.prototype.addAutoFormulaFunctions = function (functions) {
  functions.forEach(function (functionAttributes) {
    var inputType = functionAttributes['input_type'] == 'number' ? 'number' : Terminology.t('readout_definition')
    var autoFormulaFunction = new AutoFormulaFunction(functionAttributes['name'], inputType, functionAttributes['description'])
    this.addAutoFormulaFunction(autoFormulaFunction)
  }.bind(this))
}

AutoFormula.prototype.addAutoFormulaReadoutDefinitions = function (readoutDefinitions) {
  readoutDefinitions.forEach(function (functionAttributes) {
    var autoFormulaFunction = new AutoFormulaReadoutDefinition(functionAttributes.name, null, null, functionAttributes.aggregation_type, functionAttributes.different_protocol, functionAttributes.protocol_condition, functionAttributes.protocol_id, functionAttributes.short_name, functionAttributes.numeric_output_readout_row_class)
    this.addAutoFormulaFunction(autoFormulaFunction)
  }.bind(this))
}

window.AutoFormula = AutoFormula
