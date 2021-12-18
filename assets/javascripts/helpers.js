import { Terminology } from 'javascripts/cross_app_utilities.js'

if (window.CDD === undefined) {
  window.CDD = {}
}

window.CDD.Helpers = {
  capitalize: function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  },

  renderDetailsPopup: function (info) {
    var additionalDataParts = []
    if (info.batchName) { additionalDataParts.push('<li><strong>' + this.capitalize(Terminology.t('batch').escapeHTML()) + ' name:</strong> ' + info.batchName + '</li>') }
    if (info.protocolName) { additionalDataParts.push('<li><strong>' + this.capitalize(Terminology.t('protocol').escapeHTML()) + ':</strong> ' + info.protocolName + '</li>') }
    if (info.runName) { additionalDataParts.push('<li><strong>' + this.capitalize(Terminology.t('run').escapeHTML()) + ':</strong> <a href="' + info.runUrl + '" target="_blank">' + info.runName + '</a></li>') }
    if (info.plateName) { additionalDataParts.push('<li><strong>' + this.capitalize(Terminology.t('plate').escapeHTML()) + ':</strong> ' + info.plateName + '</li>') }
    if (info.well) { additionalDataParts.push('<li><strong>' + this.capitalize(Terminology.t('well').escapeHTML()) + ':</strong> ' + info.well + '</li>') }
    if (info.popupData) {
      info.popupData.forEach(function (labelAndValue) {
        additionalDataParts.push('<li style="clear: both"><strong>' + labelAndValue[0] + ':</strong> ' + labelAndValue[1] + '</li>')
      })
    }

    var html = '<h3>'
    if (info.url) {
      html += '<a href="' + info.url + '" target="_blank">' + info.name + '</a></h3>'
      const structureImageTag = info.structureless ? '<div class="thumbnail molecule-img__structureless"><p>No Structure</p></div>' : '<img class="thumbnail" src="' + info.url + '.svg" width="124" height="124">'
      html += '<a href="' + info.url + '" target="_blank">' + structureImageTag + '</a>'
    } else {
      html += info.name + '</h3>'
    }
    if (additionalDataParts.length > 0) { html += '<ul>' + additionalDataParts.join('') + '</ul>' }

    return '<div class="details-popup">' + html + '</div>'
  },

  // Please use this after any rjs (.js.erb) execution to do all the things we normally do on page load.
  // Used to reload react components `window.CDD.Helpers.rjsPostProcessing();`
  rjsPostProcessing: function () {
    window.renderReactComponents()
    window.dispatchEvent(new CustomEvent('rjsPostProcessing'))
  },
}
