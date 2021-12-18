if (window.CDD === undefined) {
  window.CDD = {}
}

var CDD = window.CDD

// Everything in this file is tested in Selenium

CDD.Projects = {
  vaultMembers: [], // set in the page as an ordered array of hashes
  setVaultMembers: function (members) {
    CDD.Projects.vaultMembers = members.map(function (member) {
      member.name = member.name.unescapeHTML()
      return member
    })
  },

  onUserSelection: function (userSelect) {
    if (userSelect.val() !== '') {
      var formElement = userSelect.closest('form')
      var selectedMemberName = userSelect.find('option:selected').text()
      userSelect.before('<span class="project-members-userName">' + selectedMemberName.escapeHTML() + '</span>')
      userSelect.before('<input type="hidden" id="' + userSelect.prop('id') + '" name="' + userSelect.prop('name') + '" value="' + userSelect.val() + '"/>')

      var selectedMember = CDD.Projects.vaultMembers.filter(function (member) {
        return member.name == selectedMemberName
      })[0]

      if (selectedMember.readonly) {
        var canEditCheckbox = userSelect.closest('tr').find('.project-members-canEditCheckbox:first')
        canEditCheckbox.prop('checked', false)
        canEditCheckbox.prop('disabled', true)
        canEditCheckbox.closest('td').hide()

        var canManageCheckbox = userSelect.closest('tr').find('.project-members-canManageCheckbox')
        canManageCheckbox.prop('checked', false)
        canManageCheckbox.prop('disabled', true)
        canManageCheckbox.closest('td').hide()

        var readOnlyCol = userSelect.closest('tr').find('td.readOnlyColumn')
        readOnlyCol.find('span').html(selectedMember.role)
        readOnlyCol.show()
      } else {
        userSelect.closest('tr').find('.project-members-canEditCheckbox').prop('checked', true)
      }

      userSelect.remove()
      CDD.Projects.updateUserSelects(formElement)
    }
  },

  onMembershipDeletion: function () {
    var row = $(this).closest('tr')
    row.find('.project-members-userName').remove()
    CDD.Projects.updateUserSelects(row.closest('form'))
  },

  updateUserSelects: function (formElement) {
    var projectMemberNames = $.makeArray(formElement.find('tbody tr:visible .project-members-userName')).map(function (element) {
      return $(element).text()
    })

    var possibleNewMembers = CDD.Projects.vaultMembers.filter(function (member) {
      return projectMemberNames.indexOf(member.name) == -1 // no way to substract an array from another in JS or Prototype.
    })

    formElement.find('.project-members-userSelect').each(function (index, userSelect) {
      userSelect.options.length = 1
      possibleNewMembers.forEach(function (member) {
        userSelect.options[userSelect.options.length] = new Option(member.name, member.id, false, false)
      })
    })
  },
}

$(document).on('click', '#admin-projects .remove-associated-model', CDD.Projects.onMembershipDeletion)

$(function () {
  $('#new_project').focusFirst()
})
