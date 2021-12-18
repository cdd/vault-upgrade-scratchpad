function BasePlotter(divName) {
  this.WIDTH_BUFFER = 70
  this.HEIGHT_BUFFER = 185
  this.MIN_HEIGHT = 300
  this.MIN_WIDTH = 400

  this.plot = null
  this.widget = $('#' + divName)
  this.container = $('#miniApp-panels-main')
}

BasePlotter.prototype.setup = function () {
  if (this.container) {
    this._sizeWidget()
    var that = this
    $(window).on('resize', function () {
      // Maximize and restore fires the resize before the page dimensions have changed
      // Use a timeout to wait for the page change
      setTimeout(that.resize.bind(that), 0)
    })
  }

  this.plot = new EJSC.Chart(this.widget[0], this.chartOptions())
  $(this.resize.bind(this))
}

BasePlotter.prototype.chartOptions = function () {
  return {
    show_legend: false,
    legend_title: 'Legend',
    title: '',
    axis_left: { caption: '' },
    axis_bottom: { caption: '' },
    axis_top: { border: { show: true } },
    axis_right: { border: { show: true } },
  }
}

BasePlotter.prototype.resetZoom = function (redraw) {
  this.plot.resetZoom(redraw)
}

BasePlotter.prototype.downloadPDF = function (converterUrl, testMode) {
  if (this._loading()) { return }

  var downloadForm = $('#pdfDownloadForm')
  if (downloadForm.length === 0) {
    downloadForm = $('<form method=\'POST\' id=\'pdfDownloadForm\' style=\'display: none;\'></form>')
    downloadForm.html(`
      <input type='hidden' name='${$.rails.csrfParam()}' value='${$.rails.csrfToken()}'>
      <input type='hidden' name='svg' id='pdfDownloadForm-svgField'>
    `)

    // eslint-disable-next-line jquery-unsafe/no-append
    $('body').append(downloadForm)
  }

  downloadForm.attr('action', converterUrl)
  $('#pdfDownloadForm-svgField').val(this.plot.exportSVG())
  if (!testMode) {
    downloadForm.submit()
  }
}

BasePlotter.prototype._loading = function () {
  return $('#globalAjax').is(':visible')
}

BasePlotter.prototype._draw = function () {
  this.plot.redraw()
}

BasePlotter.prototype._sizeWidget = function () {
  this.widget.css({ width: this._computeWidgetWidth() + 'px', height: this._computeWidgetHeight() + 'px' })
}

BasePlotter.prototype._computeWidgetWidth = function () {
  return Math.max(this.container.width() - this.WIDTH_BUFFER, this.MIN_WIDTH)
}

BasePlotter.prototype._computeWidgetHeight = function () {
  return Math.max(this.container.height() - this.HEIGHT_BUFFER, this.MIN_HEIGHT)
}

BasePlotter.prototype.resize = function () {
  this._sizeWidget()
  this._draw()
}

window.BasePlotter = BasePlotter
export default BasePlotter
