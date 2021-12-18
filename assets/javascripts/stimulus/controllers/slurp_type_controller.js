import { Controller } from 'stimulus'

// There is a select inside this view that has several options.
// Each option is used to set multiple values.
// Some of the options have child options.  They also set values.
// So this is a little JS magic that helps with all that stuff.
export default class extends Controller {
  static targets = [
    'select', // Select slurp type
    'with_or_without', // With/without select
    'slurp_type', // hidden field for mapping_optoins slurp_type
    'registration_type', // hidden field for slurp registration_type
  ]

  initialize() {
    this.change()
  }

  change(event) {
    let selectOption = this.selectTarget.options[this.selectTarget.selectedIndex]
    let registrationValue = selectOption.getAttribute('data-values-registration-type')
    this.registration_typeTarget.value = registrationValue

    let withOrWithoutTemplate = selectOption.querySelectorAll('template')[0]
    if (withOrWithoutTemplate) {
      // Don't update the select if the select caused the change
      if (!event || (event.currentTarget != this.with_or_withoutTarget)) {
        let options = withOrWithoutTemplate.innerHTML
        this.with_or_withoutTarget.innerHTML = options // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml
        this.with_or_withoutTarget.classList.remove('hidden')
      }
      let withOrWithoutOption = this.with_or_withoutTarget.options[this.with_or_withoutTarget.selectedIndex]
      let withOrWithoutValue = withOrWithoutOption.value
      this.slurp_typeTarget.value = withOrWithoutValue
    } else {
      this.with_or_withoutTarget.innerHTML = ''
      this.with_or_withoutTarget.classList.add('hidden')
      this.registration_typeTarget.value = registrationValue
      let slurpValue = selectOption.getAttribute('data-values-slurp-type')
      this.slurp_typeTarget.value = slurpValue
    }
  }
}
