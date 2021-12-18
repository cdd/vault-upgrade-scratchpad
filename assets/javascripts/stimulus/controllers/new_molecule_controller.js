import { Controller } from 'stimulus'

import constants from 'javascripts/constants.js'
const { REGISTRATION_TYPES } = constants

// Used on app/views/molecules/new.html.haml
export default class extends Controller {
  static targets = [ 'registrationType', 'typeSpecificFormContent', 'chemicalStructure', 'other', 'nucleotide', 'aminoAcid', 'mixture' ]

  connect() {
    this.renderSpecificTypeForm()
  }

  renderSpecificTypeForm() {
    const registration_types = Object.fromEntries(REGISTRATION_TYPES)

    const type = (this.hasRegistrationTypeTarget) ? this.registrationTypeTarget.value : this.data.get('initialRegistrationType')
    switch (type) {
      case registration_types['REGISTRATION_TYPE_CHEMICAL_STRUCTURE']:
        this.setChildNode(this.chemicalStructureTarget)
        break
      case registration_types['REGISTRATION_TYPE_OTHER']:
        this.setChildNode(this.otherTarget)
        break
      case registration_types['REGISTRATION_TYPE_NUCLEOTIDE']:
        this.setChildNode(this.nucleotideTarget)
        break
      case registration_types['REGISTRATION_TYPE_AMINO_ACID']:
        this.setChildNode(this.aminoAcidTarget)
        break
      case registration_types['REGISTRATION_TYPE_MIXTURE']:
        this.setChildNode(this.mixtureTarget)
        break
    }
  }

  setChildNode(target) {
    var clone = target.cloneNode(true)
    clone.hidden = false
    this.typeSpecificFormContentTarget.innerHTML = ''
    this.typeSpecificFormContentTarget.appendChild(clone)
    window.renderReactComponents('.type_specific_form_content')
  }
}
