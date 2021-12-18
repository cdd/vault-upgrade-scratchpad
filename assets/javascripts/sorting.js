var sorting = {
  updateHeaderSortingState: function (wrapper, cell, sortDirection) {
    wrapper.find('th.sorted').removeClass('sorted ascending descending').addClass('sortable')
    cell.removeClass('sortable').addClass('sorted ' + (sortDirection == 'DESC' ? 'descending' : 'ascending'))
  },

  setSortParameters: function (new_sort_by) {
    var sort_by_input = $($('#sorting_form').prop('sort_by'))
    var sort_direction_input = $($('#sorting_form').prop('sort_direction'))
    var display_options_sort_by = $($('#display_options_form').prop('sort_by'))
    var display_options_sort_direction = $($('#display_options_form').prop('sort_direction'))

    if (display_options_sort_by[0].value !== 'molecule_header' && new_sort_by === 'molecule_header') {
      sort_direction_input.val('DESC')
    } else if (new_sort_by === sort_by_input.val()) {
      sort_direction_input.val(sort_direction_input.val() === 'DESC' ? 'ASC' : 'DESC')
    } else {
      sort_direction_input.val('ASC')
    }

    sort_by_input.val(new_sort_by)
    display_options_sort_by.val(sort_by_input.val())
    display_options_sort_direction.val(sort_direction_input.val())
  },
}

$(document).on('ajax:before', '.sorting-link', function () {
  sorting.setSortParameters($(this).closest('th').attr('id'))
  $(this).data('params', $('#sorting_form').serialize())
})

window.sorting = sorting
