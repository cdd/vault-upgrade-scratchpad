function updateControlCssClass(element) {
  element = $(element)
  if (element.length > 0) {
    var hidden_field = element.find('input').first()

    if (hidden_field.length > 0) {
      var hiddenFieldValue = hidden_field.val().trim()
      element.toggleClass('empty', hiddenFieldValue === '')
      element.toggleClass('control', hiddenFieldValue !== '')
      element.toggleClass('positive', hiddenFieldValue === '+')
      element.toggleClass('negative', hiddenFieldValue === '-')
      element.toggleClass('reference', hiddenFieldValue === '#')
    }
  }
}

export function toggleControl(element) {
  element = $(element)

  if (element.length > 0) {
    var hidden_field = element.find('input').first()

    if (hidden_field.length > 0) {
      var states = ['', '+', '-', '#']
      var current_index = states.indexOf(hidden_field.val())
      hidden_field.val(states[(current_index + 1) % states.length])
    }

    updateControlCssClass(element)
  }
}

export function toggleRow(row_header_cell) {
  var table_row = $(row_header_cell).parent()
  var wells = table_row.find('td')
  wells.each(function () { toggleControl(this) })
}

export function toggleColumn(column_header_cell) {
  column_header_cell = $(column_header_cell)
  var column_index = column_header_cell.parent().find('th').toArray().indexOf(column_header_cell[0]) - 1
  var enclosing_table = column_header_cell.parents('table:first')
  var tbody = enclosing_table.find('tbody:first')
  tbody.find('tr').each(function () {
    toggleControl($(this).find('td')[column_index])
  })
}

export function resetControlCssClasses() {
  var wells_element = $('#wells')
  if (wells_element.length > 0) {
    wells_element.find('td').each(function () {
      updateControlCssClass(this)
    })
  }
}

export function plateChosenForNewControlLayout(event) {
  var textField = event.target
  if (textField.value.trim() === '') {
    return
  }

  // can't submit the form here, otherwise globalAjax will be instantly hidden again when the autocompleter completes its
  // call sequence (calling this function isn't the last thing it does). We must blur the text field, otherwise the
  // autocompleter calls stopIndicator() all the time and hides globalAjax again, again causing the problem that it doesn't
  // show during form submission. This problem would be avoided if we didn't have a single global Ajax indicator, but we do : )
  textField.blur()
  textField.form.enableSubmit()
  textField.form.selectedName = textField.value
}

export function disablePlateSelectFormIfInvalid(event) {
  var textField = event.target
  if (textField.value != textField.form.selectedName) {
    textField.form.disableSubmit()
  }
}

$(resetControlCssClasses)

$(document).on('click', '.well-row-header', function () {
  toggleRow(this)
})

$(document).on('click', '.well-column-header', function () {
  toggleColumn(this)
})

$(document).on('click', '.well-control-cell', function () {
  toggleControl(this)
})

window.setUpPlateAutocomplete = function () {
  $('#new_control_layout_plate_name').autocomplete({
    minLength: 1,
    autoFocus: true,
    html: true,
    source: $('#new_control_layout_plate_name').data('autocompleteUrl'),
    select: plateChosenForNewControlLayout,
  }).on('keyup', disablePlateSelectFormIfInvalid)
}

$(setUpPlateAutocomplete)
