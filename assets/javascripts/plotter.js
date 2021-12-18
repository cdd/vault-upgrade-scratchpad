import './base_plotter.js'
import { Terminology } from 'javascripts/cross_app_utilities.js'

function Plotter(divName, dataUrl, contextUrl) {
  this.data = null
  this.dataUrl = null
  this.contextUrl = null

  BasePlotter.call(this, divName, dataUrl, contextUrl)
  this.dataUrl = dataUrl
  this.contextUrl = contextUrl
}

Plotter.prototype = Object.create(window.BasePlotter.prototype)
Plotter.prototype.constructor = Plotter

Plotter.prototype.setup = function () {
  BasePlotter.prototype.setup.call(this)
  this.plot.onShowHint = this.onMoleculeSelection.bind(this)
  this.plot.onBeforeUnselectPoint = this.onMoleculeUnselection.bind(this)
  this._loadData()
}

Plotter.prototype.chartOptions = function () {
  var options = BasePlotter.prototype.chartOptions.call(this)
  options.usePixelApi = true
  return options
}

Plotter.prototype.selectXAxis = function (xAxis) {
  this.resetZoom(false)
  this.data.buildXExtractor(xAxis)
  $('#plotter-options-xAxisTitle').val(this.data.getXAxisTitle())
  this.plot.axis_bottom.setCaption(this.data.getXAxisTitle().escapeHTML())
  this._updatePlot()
}

Plotter.prototype.selectYAxis = function (yAxis) {
  this.resetZoom(false)
  this.data.buildYExtractor(yAxis)
  $('#plotter-options-yAxisTitle').val(this.data.getYAxisTitle())
  this.plot.axis_left.setCaption(this.data.getYAxisTitle().escapeHTML())
  this._updatePlot()
}

Plotter.prototype.selectSeries = function (seriesSelection) {
  this.resetZoom(false)
  if (seriesSelection == 'Samples only') {
    this.data.showDataSeriesByJsonIdentifiers([this.data.SAMPLE_JSON_IDENTIFIER])
  } else if (seriesSelection == 'Controls only') {
    this.data.showDataSeriesByJsonIdentifiers(this.data.CONTROL_JSON_IDENTIFIERS)
  } else {
    this.data.showDataSeriesByJsonIdentifiers(this.data.SAMPLE_AND_CONTROL_JSON_IDENTIFIERS)
  }
  this._updateStatistics()
}

Plotter.prototype.setPointSize = function (pointSize) {
  if (this.data != null) {
    this.data.setPointSize(parseFloat(pointSize))
    this._draw()
  }
}

Plotter.prototype.toggleMeanDisplay = function () {
  this.data.toggleMeanDisplay()
  this._updatePlot()
}

Plotter.prototype.toggleStandardDeviationDisplay = function () {
  this.data.toggleStandardDeviationDisplay()
  this._updatePlot()
}

Plotter.prototype.setStandardDeviationMultiplier = function (multiplier) {
  this.data.setStandardDeviationMultiplier(parseFloat(multiplier) || 1.0)
  this._updatePlot()
}

Plotter.prototype.userChangedOptions = function () {
  this.plot.setTitle($('#plotter-options-title').val().escapeHTML())
  this.plot.axis_bottom.setCaption($('#plotter-options-xAxisTitle').val().escapeHTML())
  this.plot.axis_left.setCaption($('#plotter-options-yAxisTitle').val().escapeHTML())
  this.plot.setShowLegend($('#plotter-options-legend').prop('checked'))

  if ($('#plotter-options-grid').prop('checked')) {
    this.plot.axis_bottom.showGrid(false)
  } else {
    this.plot.axis_bottom.hideGrid(false)
  }

  if ($('#plotter-options-grid').prop('checked')) {
    this.plot.axis_left.showGrid(false)
  } else {
    this.plot.axis_left.hideGrid(false)
  }
  this.plot.redrawAxes()
}

Plotter.prototype.setPlotHintText = function (text) {
  // eslint-disable-next-line no-unsafe-innerhtml/no-unsafe-innerhtml
  this.plot.__el_hint_text.innerHTML = text
}

Plotter.prototype.fetchPopupContents = function (point, url) {
  var that = this
  $.ajax(url, {
    method: 'GET',
    success: function (data) {
      // multiple AJAX calls could coexist, make sure when they return that we only update the hint if we're still on the same point
      if (point === that.plot.selected_point) {
        that.setPlotHintText(data)
      }
    },
  })
}

Plotter.prototype.onMoleculeSelection = function (point, series, chart, hintElement, hoverOrSelect) {
  if (series.indexes !== null && point !== null) {
    var that = this
    var url = this.buildPopupUrl(point, series)

    if (hoverOrSelect === 'hover') {
      this.moleculeSelectionTimeout = setTimeout(function () {
        that.fetchPopupContents(point, url)
      }, 500)
    } else if (hoverOrSelect === 'select') {
      this.clearAjaxTimeout()
      this.fetchPopupContents(point, url)
    }

    // pre-set size to prevent bubble overflow.
    return "<div style='width:320px; height:154px; '>Loading...</div>"
  }
}

Plotter.prototype.buildPopupUrl = function (point, series) {
  var result = this.data.data[series.indexes[point.userdata][0]]
  var rowIndex = series.indexes[point.userdata][1]
  var yExtractor = this.data.yExtractor
  var yObject = result[yExtractor.headerGroupIndex][rowIndex][yExtractor.headerIndex]
  return new Plotter.PopupUrlBuilder(this, point, result, yObject).getUrl()
}

Plotter.prototype.onMoleculeUnselection = function () {
  this.clearAjaxTimeout()
}

Plotter.prototype.clearAjaxTimeout = function () {
  if (this.moleculeSelectionTimeout) {
    clearTimeout(this.moleculeSelectionTimeout)
    this.moleculeSelectionTimeout = null
  }
}

Plotter.prototype._loadData = function () {
  $('#plot').hide()
  $('#plot-loading').show()
  new Plotter.StreamlinedAjaxDataLoader(this, this.dataUrl)
}

Plotter.prototype.showPlot = function (plotterData) {
  this.data = new Plotter.Data(this, plotterData)

  if (plotterData.warning) {
    this._addWarning(plotterData.warning)
  }

  this.defaultIndexType = plotterData.defaultIndexType

  $('#plotter-options-axes-scatter-x option').length = 0
  var xCount = 0
  $('#plotter-options-axes-scatter-x')[0].options[xCount++] = new Option(this.data.buildDefaultXExtractor(this.defaultIndexType).getAxisTitle(), '', false, false)
  this.data.headers.forEach(function (headerGroup) {
    headerGroup.getHeadersForXAxis().forEach(function (header) {
      $('#plotter-options-axes-scatter-x')[0].options[xCount++] = new Option(header.getAxisTitle(), [headerGroup.index, header.index], false, false)
    })
  })

  $('#plotter-options-axes-scatter-y option').length = 0
  var yCount = 0
  this.data.headers.forEach(function (headerGroup) {
    headerGroup.getHeadersForYAxis().forEach(function (header) {
      $('#plotter-options-axes-scatter-y')[0].options[yCount++] = new Option(header.getAxisTitle(), [headerGroup.index, header.index], false, false)
    })
  })

  if (xCount > 0 && yCount > 0) {
    this.selectXAxis($('#plotter-options-axes-scatter-x option:first').val())
    this.selectYAxis($('#plotter-options-axes-scatter-y option:first').val())
  }

  $('#plot-loading').hide()
  $('#plot').show()
  $('#plotter-options')[0].disabled = false
}

Plotter.prototype._addWarning = function (warning) {
  $('#plotter-warningMessageSection').show()
  $('#plotter-warningMessage').text(warning)
}

Plotter.prototype._updatePlot = function () {
  if (this.data.canGenerateSeries()) {
    this._updateStatistics()
    this._draw()
  }
}

Plotter.prototype._updateStatistics = function () {
  /* eslint-disable jquery-unsafe/no-html */
  $('#stats-title').html(this.data.getYAxisTitle().escapeHTML() + ' statistics')
  $('#stats-mean').html(this.data.getCurrentSeriesMean())
  $('#stats-median').html(this.data.getCurrentSeriesMedian())
  $('#stats-sampleStandardDeviation').html(this.data.getCurrentSeriesSampleStandardDeviation())
  $('#stats-minimum').html(this.data.getCurrentSeriesMinimum())
  $('#stats-median').html(this.data.getCurrentSeriesMedian())
  $('#stats-maximum').html(this.data.getCurrentSeriesMaximum())
  /* eslint-enable jquery-unsafe/no-html */
}

Plotter.StreamlinedAjaxDataLoader = function (plotter, dataUrl) {
  $.ajax(dataUrl, {
    async: true,
    method: 'GET',
    dataType: 'json',
    success: plotter.showPlot.bind(plotter),
  })
}

Plotter.Data = function (plotter, JSONData) {
  this.SAMPLE_TITLE = '<span class="ejsc-legend-series-caption-bullet">&bull;</span> Sample'
  this.POSITIVE_CONTROL_TITLE = '<span class="ejsc-legend-series-caption-bullet">&bull;</span> Positive control (hit)'
  this.NEGATIVE_CONTROL_TITLE = '<span class="ejsc-legend-series-caption-bullet">&bull;</span> Negative control'
  this.REFERENCE_MOLECULE_CONTROL_TITLE = '<span class="ejsc-legend-series-caption-bullet">&bull;</span> Reference ' + Terminology.t('molecule')
  this.UNSPECIFIED_CONTROL_TITLE = '<span class="ejsc-legend-series-caption-bullet">&bull;</span> Control'

  this.SAMPLE_JSON_IDENTIFIER = ''
  this.POSITIVE_CONTROL_JSON_IDENTIFIER = '+'
  this.NEGATIVE_CONTROL_JSON_IDENTIFIER = '-'
  this.REFERENCE_MOLECULE_JSON_IDENTIFIER = '#'
  this.UNSPECIFIED_CONTROL_JSON_IDENTIFIER = '?'

  this.plotter = plotter
  this.data = JSONData.data
  this.plateSizes = JSONData.plateSizes
  this.headers = JSONData.headers.map(function (headerGroup, index) { return new Plotter.HeaderGroup(headerGroup, index) })
  this.displayMean = false
  this.displayStandardDeviation = false
  this.standardDeviationMultiplier = 1.0
  this.dataSeries = []
  this.pointSize = 1.2

  this.seriesDetails = {}
  this.seriesDetails[this.SAMPLE_JSON_IDENTIFIER] = { title: this.SAMPLE_TITLE, color: '#000', visible: true }
  this.seriesDetails[this.POSITIVE_CONTROL_JSON_IDENTIFIER] = { title: this.POSITIVE_CONTROL_TITLE, color: '#f00', visible: true }
  this.seriesDetails[this.NEGATIVE_CONTROL_JSON_IDENTIFIER] = { title: this.NEGATIVE_CONTROL_TITLE, color: '#00f', visible: true }
  this.seriesDetails[this.REFERENCE_MOLECULE_JSON_IDENTIFIER] = { title: this.REFERENCE_MOLECULE_CONTROL_TITLE, color: '#fa1', visible: true }
  this.seriesDetails[this.UNSPECIFIED_CONTROL_JSON_IDENTIFIER] = { title: this.UNSPECIFIED_CONTROL_TITLE, color: '#0f0', visible: true }

  this.SAMPLE_AND_CONTROL_JSON_IDENTIFIERS = Object.keys(this.seriesDetails)
  this.CONTROL_JSON_IDENTIFIERS = this.SAMPLE_AND_CONTROL_JSON_IDENTIFIERS.filter(function (category) { return category !== '' })
}

Plotter.Data.prototype.toggleMeanDisplay = function () {
  this.displayMean = !this.displayMean
  if (this.displayMean) {
    this._addMeanSeries()
  } else {
    if (this.meanSeries) { this.plotter.plot.removeSeries(this.meanSeries, false) }
  }
}

Plotter.Data.prototype.toggleStandardDeviationDisplay = function () {
  this.displayStandardDeviation = !this.displayStandardDeviation
  if (this.displayStandardDeviation) {
    this._addStandardDeviationSerieses()
  } else {
    this._removeStandardDeviationSerieses()
  }
}

Plotter.Data.prototype.setStandardDeviationMultiplier = function (multiplier) {
  this.standardDeviationMultiplier = multiplier
  if (this.displayStandardDeviation) {
    this._removeStandardDeviationSerieses()
    this._addStandardDeviationSerieses()
  }
}

Plotter.Data.prototype.buildXExtractor = function (selection) {
  if (this._blank(selection)) {
    this.xExtractor = this.buildDefaultXExtractor(this.plotter.defaultIndexType)
  } else {
    this.xExtractor = new Plotter.DataExtractor(selection, this.headers)
  }
  this.plotter.plot.axis_bottom.onNeedsTicks = this.xExtractor.tickFormatter()
  this._updateData()
}

Plotter.Data.prototype.buildDefaultXExtractor = function (defaultIndexType) {
  return defaultIndexType == 'well' ? new Plotter.WellIndexExtractor(this) : new Plotter.MoleculeIndexExtractor()
}

Plotter.Data.prototype.buildYExtractor = function (selection) {
  this.yExtractor = new Plotter.DataExtractor(selection, this.headers)
  this._updateData()
}

Plotter.Data.prototype.getXAxisTitle = function () {
  return this.xExtractor.getAxisTitle()
}

Plotter.Data.prototype.getYAxisTitle = function () {
  return this.yExtractor.getAxisTitle()
}

Plotter.Data.prototype.canGenerateSeries = function () {
  return this.xExtractor && this.yExtractor
}

Plotter.Data.prototype.getCurrentSeriesMean = function () {
  return this.cachedStatistics.getFormattedMean()
}

Plotter.Data.prototype.getCurrentSeriesSampleStandardDeviation = function () {
  return this.cachedStatistics.getFormattedSampleStandardDeviation()
}

Plotter.Data.prototype.getCurrentSeriesMinimum = function () {
  return this.cachedStatistics.getFormattedMinimum()
}

Plotter.Data.prototype.getCurrentSeriesMedian = function () {
  return this.cachedStatistics.getFormattedMedian()
}

Plotter.Data.prototype.getCurrentSeriesMaximum = function () {
  return this.cachedStatistics.getFormattedMaximum()
}

Plotter.Data.prototype.showDataSeriesByJsonIdentifiers = function (seriesJsonIdentifiers) {
  for (var key in this.seriesDetails) {
    var series = this.dataSeries.filter(function (series) { return series.title === this.seriesDetails[key].title }, this)
    if (series.length > 0) {
      var visible = seriesJsonIdentifiers.indexOf(key) !== -1
      this.seriesDetails[key].visible = visible
      visible ? series[0].show() : series[0].hide()
    }
    this._resetStatistics()
  }
}

Plotter.Data.prototype.setPointSize = function (size) {
  this.pointSize = size
  this.dataSeries.forEach(function (series) {
    series.pointSize = this.pointSize
  }, this)
}

Plotter.Data.prototype._updateData = function () {
  var key
  if (!this.canGenerateSeries()) { return }

  this.dataSeries.length = 0
  this.plotter.plot.clearSeries(false)

  var temporarySeries = {}
  for (key in this.seriesDetails) {
    temporarySeries[key] = { data: [], indexes: [], count: 0, options: this.seriesDetails[key] }
  }

  for (var resultIndex = 0; resultIndex < this.data.length; ++resultIndex) {
    var row = this.data[resultIndex]
    var x = this.xExtractor.getValue(row, resultIndex)

    var yValues = this.yExtractor.getValues(row)
    // PERFORMANCE: caching the array length within the larger loop is the result of actual performance profiling
    for (var yValueIndex = 0, yValuesLength = yValues.length; yValueIndex < yValuesLength; ++yValueIndex) {
      var yData = yValues[yValueIndex]
      var y = yData.value
      if (!this._blank(x) && !this._blank(y)) {
        var s = temporarySeries[yData.controlType]
        s.data.push([x, y, null, s.count++])
        s.indexes.push([resultIndex, yData.rowIndex])
      }
    }
  }

  for (key in temporarySeries) {
    var category = temporarySeries[key]
    if (category.data.length > 0) {
      category.data.sort(function (a, b) { return a[0] - b[0] })

      var serie = new EJSC.ScatterSeries(
        new EJSC.ArrayDataHandler(category.data), $.extend({ pointStyle: 'circle', opacity: 100, pointSize: this.pointSize, autosort: false }, category.options))
      serie.indexes = category.indexes
      this.dataSeries.push(this.plotter.plot.addSeries(serie, false))
    }
  }

  this._resetStatistics()
  this._addMeanSeries()
  this._addStandardDeviationSerieses()
}

Plotter.Data.prototype._resetStatistics = function () {
  this.cachedStatistics = new Plotter.Statistics()
  this.dataSeries.forEach(function (series) {
    if (series.visible) {
      var points = series.getDataHandler().getArray()
      for (var index = 0, pointsLength = points.length; index < pointsLength; ++index) {
        this.cachedStatistics.addValue(parseFloat(points[index][1]))
      }
    }
  }, this)
}

Plotter.Data.prototype._blank = function (string_or_null) {
  return string_or_null === null || string_or_null === ''
}

Plotter.Data.prototype._addMeanSeries = function () {
  if (this.displayMean && this.cachedStatistics._getMean()) {
    this.meanSeries = this._addHorizontalLine(this.cachedStatistics._getMean(), { id: 'mean', color: '#540054' })
  }
}

Plotter.Data.prototype._addStandardDeviationSerieses = function () {
  if (this.displayStandardDeviation && this.cachedStatistics._getSampleStandardDeviation()) {
    var deviation = this.standardDeviationMultiplier * this.cachedStatistics._getSampleStandardDeviation()
    this.meanPlusSsdSeries = this._addHorizontalLine(this.cachedStatistics._getMean() + deviation, { color: '#a97fa9' })
    this.meanMinusSsdSeries = this._addHorizontalLine(this.cachedStatistics._getMean() - deviation, { color: '#a97fa9' })
  }
}

Plotter.Data.prototype._removeStandardDeviationSerieses = function () {
  if (this.meanMinusSsdSeries) { this.plotter.plot.removeSeries(this.meanMinusSsdSeries, false) }
  if (this.meanPlusSsdSeries) { this.plotter.plot.removeSeries(this.meanPlusSsdSeries, false) }
}

Plotter.Data.prototype._addHorizontalLine = function (y, options) {
  var serie = new EJSC.FunctionSeries(function () { return y }, $.extend({ lineWidth: 1, drawPoints: false, legendIsVisible: false, hint_string: '' }, options))
  this.plotter.plot.addSeries(serie, false)
  return serie
}

Plotter.DataExtractor = function (selection, headerGroups) {
  var indexes = selection.split(',')
  this.headerGroupIndex = indexes[0]
  this.headerIndex = indexes[1]
  this.headerGroup = headerGroups[this.headerGroupIndex]
  this.header = this.headerGroup.headers[this.headerIndex]
}

Plotter.DataExtractor.prototype.isDefaultIndex = function () {
  return false
}

Plotter.DataExtractor.prototype.getAxisTitle = function () {
  return this.header.getAxisTitle()
}

Plotter.DataExtractor.prototype.getValues = function (result) {
  var values = []
  var rows = result[this.headerGroupIndex]

  if (rows) {
    // PERFORMANCE: caching the array length within the larger loop is the result of actual performance profiling
    for (var index = 0, rowsLength = rows.length; index < rowsLength; ++index) {
      var row = rows[index]
      if (row[this.headerIndex]) {
        values.push({ value: row[this.headerIndex].v, controlType: (row.c || ''), batch: row.b, rowIndex: index })
      }
    }
  }
  return values
}

Plotter.DataExtractor.prototype.getValue = function (row) {
  if (row[this.headerGroupIndex] && row[this.headerGroupIndex][0] && row[this.headerGroupIndex][0][this.headerIndex]) {
    return row[this.headerGroupIndex][0][this.headerIndex].v
  } else {
    return null
  }
}

Plotter.DataExtractor.prototype.tickFormatter = function () {
  return null
}

Plotter.MoleculeIndexExtractor = function () {}
Plotter.MoleculeIndexExtractor.prototype.isDefaultIndex = function () {
  return true
}

Plotter.MoleculeIndexExtractor.prototype.isWellIndex = function () {
  return false
}

Plotter.MoleculeIndexExtractor.prototype.getAxisTitle = function () {
  return _.capitalize(Terminology.t('molecule')) + ' Index'
}

Plotter.MoleculeIndexExtractor.prototype.getValue = function (row, index) {
  return index + 1
}

Plotter.MoleculeIndexExtractor.prototype.tickFormatter = function () {
  return null
}

Plotter.WellIndexExtractor = function (json) {
  this.rowNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF']
  this.plateRowLengths = { 96: 12, 384: 24, 1536: 48 }

  var that = this
  this.plateSizes = json.plateSizes
  this.lastWellIndex = (function () {
    for (var index = 0; index < json.data.length; index++) {
      if (typeof (json.data[index][0][0].w) === 'undefined' || json.data[index][0][0].w === null) {
        return index
      }
    }
    return json.data.length
  }())

  this.plateOffsets = (function () {
    var lastIndex = 0
    var result = {}
    var plateNames = Object.keys(json.plateSizes).sort()
    plateNames.forEach(function (plateName) {
      result[plateName] = lastIndex
      lastIndex += that.plateSizes[plateName]
    })
    if (that.lastWellIndex < json.data.length) { result['no plate'] = lastIndex }
    return result
  }())
}

Plotter.WellIndexExtractor.prototype.isDefaultIndex = function () {
  return true
}

Plotter.WellIndexExtractor.prototype.isWellIndex = function () {
  return true
}

Plotter.WellIndexExtractor.prototype.getAxisTitle = function () {
  return 'Well Index'
}

Plotter.WellIndexExtractor.prototype.tickFormatter = function () {
  var that = this // see JavaScript the good parts p29
  return function () {
    var plateNames = Object.keys(that.plateOffsets).sort()
    return plateNames.map(function (plateName) {
      return [that.plateOffsets[plateName], plateName]
    })
  }
}

Plotter.WellIndexExtractor.prototype.getValue = function (row, index) {
  var well = row[0][0].w

  if (well) {
    var plate = row[0][0].p
    var rowName = well.match(/\D+/)[0]
    var colNumber = parseInt(well.match(/\d+/)[0], 10)
    var wellIndexWithinPlate = this.rowNames.indexOf(rowName) * (this.plateRowLengths[this.plateSizes[plate]]) + colNumber
    return this.plateOffsets[plate] + wellIndexWithinPlate
  } else {
    return this.plateOffsets['no plate'] + (index - this.lastWellIndex + 1)
  }
}

Plotter.Header = function (header, headerGroup, index) {
  $.extend(this, header)
  this.headerGroup = headerGroup
  this.index = index
  this.name = this.n
}

Plotter.Header.prototype.canBePlotted = function () {
  return this.t == 1 && this.c > 0
}

Plotter.Header.prototype.getAxisTitle = function () {
  if (this.headerGroup.isChemicalProperties()) {
    return this.name
  } else {
    return this.headerGroup.name + ': ' + this.name
  }
}

Plotter.HeaderGroup = function (headerGroup, index) {
  $.extend(this, headerGroup)
  this.index = index
  this.name = this.n
  this.headers = this.h.map(function (header, index) { return new Plotter.Header(header, this, index) }, this)
  this.plottableHeaders = this.headers.filter(function (header) { return header.canBePlotted() })
}

Plotter.HeaderGroup.prototype.getHeadersForXAxis = function () {
  if (this.isChemicalProperties()) {
    return this.plottableHeaders
  } else {
    return []
  }
}

Plotter.HeaderGroup.prototype.getHeadersForYAxis = function () {
  return this.plottableHeaders
}

Plotter.HeaderGroup.prototype.isChemicalProperties = function () {
  return this.name == 'Properties'
}

Plotter.Statistics = function () {
  this.sum = 0.0
  this.sumOfSquares = 0.0
  this.maximum = null
  this.minimum = null
  this.medianValues = []
  this.medianValuesSorted = true
  this.maxNumberOfDecimalPlaces = 0
}

Plotter.Statistics.prototype.addValue = function (value) {
  this.sum += value
  this.sumOfSquares += Math.pow(value, 2.0)
  this.maximum = this.maximum ? Math.max(value, this.maximum) : value
  this.minimum = this.minimum ? Math.min(value, this.minimum) : value
  this.medianValues.push(value)
  this.medianValuesSorted = false
  this.maxNumberOfDecimalPlaces = Math.max(this.maxNumberOfDecimalPlaces, this._calculateDecimalPlaces(value))
}

Plotter.Statistics.prototype.getFormattedMean = function () {
  return this._format(this._getMean(), this.maxNumberOfDecimalPlaces)
}

Plotter.Statistics.prototype.getFormattedSampleStandardDeviation = function () {
  return this._format(this._getSampleStandardDeviation(), this.maxNumberOfDecimalPlaces)
}

Plotter.Statistics.prototype.getFormattedMinimum = function () {
  return this.minimum ? this.minimum.toString() : 'N/A'
}

Plotter.Statistics.prototype.getFormattedMedian = function () {
  if (!this.medianValuesSorted) {
    this.medianValues.sort(function (a, b) { return a - b }) // sort numerically, not alphanumerically
    this.medianValuesSorted = true
  }

  if (this.medianValues.length === 0) {
    return 'N/A'
  } else if (this.medianValues.length % 2 == 1) {
    return this.medianValues[(this.medianValues.length - 1) / 2].toString()
  } else {
    var index = parseInt(this.medianValues.length / 2, 10)
    var numberOfDecimalPlaces = Math.max(this._calculateDecimalPlaces(this.medianValues[index - 1]), this._calculateDecimalPlaces(this.medianValues[index - 1]))
    return this._format(0.5 * (this.medianValues[index - 1] + this.medianValues[index]), numberOfDecimalPlaces)
  }
}

Plotter.Statistics.prototype.getFormattedMaximum = function () {
  return this.maximum ? this.maximum.toString() : 'N/A'
}

Plotter.Statistics.prototype._getCount = function () {
  return this.medianValues.length
}

Plotter.Statistics.prototype._getMean = function () {
  return this._getCount() === 0 ? null : (this.sum / this._getCount())
}

Plotter.Statistics.prototype._getSampleStandardDeviation = function () {
  if (this._getCount() < 2) {
    return null
  } else {
    return Math.sqrt((this.sumOfSquares - this._getCount() * Math.pow(this._getMean(), 2)) / (this._getCount() - 1))
  }
}

Plotter.Statistics.prototype._format = function (value, numberOfDecimalPlaces) {
  return value ? value.toFixed(numberOfDecimalPlaces) : 'N/A'
}

Plotter.Statistics.prototype._calculateDecimalPlaces = function (value) {
  var string = value.toString()
  var dotIndex = string.indexOf('.')
  return dotIndex == -1 ? 0 : string.length - dotIndex - 1
}

Plotter.PopupUrlBuilder = function (plotter, point, result, yObject) {
  this.point = point
  this.contextUrl = plotter.contextUrl
  this.xExtractor = plotter.data.xExtractor
  this.yExtractor = plotter.data.yExtractor
  this.yObjectId = yObject.i
  this.moleculeId = result.i
  this.queryString = $.param(this.buildQueryStringObject())
}

Plotter.PopupUrlBuilder.prototype.getUrl = function () {
  return this.appendQueryString(this.buildUrlBase())
}

Plotter.PopupUrlBuilder.prototype.buildQueryStringObject = function () {
  var queryStringObject = { 'properties[]': [], 'values[]': [] }
  if (!this.xExtractor.isDefaultIndex()) {
    queryStringObject['properties[]'].push(this.xExtractor.header.name)
    queryStringObject['values[]'].push(this.point.x)
  }

  if (this.yObjectId === undefined) {
    queryStringObject['properties[]'].push(this.yExtractor.header.name)
    queryStringObject['values[]'].push(this.point.y)
  }

  return queryStringObject
}

Plotter.PopupUrlBuilder.prototype.buildUrlBase = function () {
  if (this.yObjectId !== undefined) {
    return this.contextUrl + '/readouts/' + this.yObjectId + '.popup'
  } else {
    return this.contextUrl + '/molecules/' + this.moleculeId + '.popup'
  }
}

Plotter.PopupUrlBuilder.prototype.appendQueryString = function (url) {
  // blank?
  if (_.trim(this.queryString)) {
    return url + '?' + this.queryString
  } else {
    return url
  }
}

window.Plotter = Plotter

$(function () {
  $('#plotter-options').prop('disabled', true)
})
