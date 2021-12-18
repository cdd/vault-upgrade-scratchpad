import { performEasyTextCopyForLinkElement } from './application_global.js'
import constants from './constants.js'
const { MOLECULE_REPRESENTATIONS_ID_LIST } = constants

// These functions are used as part of the asynchronous fetching of molecule representations (for example in the structure lightbox
CDD.MoleculeRepresentations = (function () {
  const CONTROLLER_URL_PREFIX = '/molecules/'
  const CONTROLLER_URL_SUFFIX = '/structure_formats'

  const fetchRepresentations = function (moleculeId, contextURL, onSuccess) {
    const url = contextURL + CONTROLLER_URL_PREFIX + moleculeId + CONTROLLER_URL_SUFFIX
    const ajaxOptions = {
      url: url,
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      method: 'GET',
      success: function (data) {
        onSuccess(data)
      },
      error: function (jqXHR, response) {
        alert('Error fetching representations: ' + response.errorMessage)
      },
    }

    CDD.ConnectionPool.enqueue(ajaxOptions)
  }

  const populateRepresentation = function (index, representations, shouldDisplayTable, idSuffix) {
    let elem = $('#' + MOLECULE_REPRESENTATIONS_ID_LIST.get(index) + idSuffix)

    elem.data('easyTextCopy', representations[index])
    if (elem.hasClass('active')) {
      performEasyTextCopyForLinkElement(elem)
    }

    if (shouldDisplayTable) {
      elem.closest('div').css('display', '')
      $('#structure_lightbox_representation_spinner_' + idSuffix).css('display', 'none')
    }
  }

  const fetchForLightboxRepresentations = function (moleculeId, contextURL, idSuffix) {
    const successCallback = (representations) => {
      for (let i = 0; i < representations.length; i++) {
        populateRepresentation(i, representations, (i === (representations.length - 1)), idSuffix)
      }
    }

    fetchRepresentations(moleculeId, contextURL, successCallback)
  }

  const fetchForSearchResultsDescriptors = function (moleculeId, contextURL) {
    fetchForLightboxRepresentations(moleculeId, contextURL, moleculeId)
  }

  return {
    fetchForLightboxRepresentations: fetchForLightboxRepresentations,
    fetchForSearchResultsDescriptors: fetchForSearchResultsDescriptors,
  }
})()
