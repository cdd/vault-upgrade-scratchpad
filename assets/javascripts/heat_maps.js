if (window.CDD === undefined) {
  window.CDD = {}
}

window.CDD.HeatMap = {
  wellDetails: {},
  previewTimeout: null,
  clickFlagEvent: null,

  wellDetail: function (event) {
    var matches = $(event.target).attr('id').match(/plate_(\d+)_well_(\d+)_(\d+)/)
    if (matches === null) { return '' }

    var details = this.wellDetails[matches[1]][matches[2]][matches[3]]
    if (details) {
      return CDD.Helpers.renderDetailsPopup(details)
    } else {
      return ''
    }
  },

  showWellDetails: function (event) {
    this.cancelPreviewWellDetails()
    balloon.hideTooltip()
    balloon.toggleTooltip(event, this.wellDetail(event))
  },

  previewWellDetails: function (event) {
    // The balloon js script loads the content right away causing image requests in rapid succession when running the mouse over heat maps.
    // We take over the delayed preview to prevent that
    balloon.delayTime = 1

    this.cancelPreviewWellDetails()
    $(event.target).on('mouseout', $.proxy(this.cancelPreviewWellDetails, this))
    this.previewTimeout = window.setTimeout(this.timeoutFunction(event), 500)
  },

  timeoutFunction: function (event) {
    return $.proxy(function () { balloon.showTooltip(event, this.wellDetail(event)) }, this)
  },

  cancelPreviewWellDetails: function () {
    if (this.previewTimeout) {
      window.clearTimeout(this.previewTimeout)
      this.previewTimeout = null
    }
  },
}
