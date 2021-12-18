import React from 'react'
import { mount } from 'enzyme'
import ChemicalPropertiesSearch from '../../../app/ChemicalPropertiesSearch/ChemicalPropertiesSearch.jsx'

const options = {
  'Structure Properties': {
    'cd_molweight': 'Molecular weight (g/mol)',
    'log_p': 'logP',
  },
  'Nucleotide Sequence Properties': {
    'nucleotide_sequence_seq_length': 'Length',
    'nucleotide_sequence_gc_content': 'GC-content',
  },
}

describe('ChemicalPropertiesSearch', () => {
  const renderAndAssert = (testParams: {
    initialSearchTerms: Object[],
    expectSelect: boolean,
    expectAdd: boolean,
    expectRemoveCount: number,
    expectOptGroupCount: number,
    expectOptionCount: number,
  }) => {
    const {
      initialSearchTerms,
      expectSelect,
      expectAdd,
      expectRemoveCount,
      expectOptGroupCount,
      expectOptionCount,
    } = testParams

    const wrapper = mount(
      <ChemicalPropertiesSearch
        fields={options}
        initialSearchTerms={initialSearchTerms}
      />
    )

    // should show a single select
    const select = wrapper.find('select')
    expect(select).to.have.lengthOf(expectSelect ? 1 : 0)

    if (select.length) {
      expect(select.find('option').first().text()).to.equal('(select property)')

      if (expectOptGroupCount !== undefined) {
        expect(select.find('optgroup')).to.have.lengthOf(expectOptGroupCount)
      }

      if (expectOptionCount !== undefined) {
        expect(select.find('option')).to.have.lengthOf(expectOptionCount)
      }
    }

    if (expectAdd !== undefined) {
      expect(wrapper.find('#chemical_properties_criterion_add_link')).to.have.lengthOf(expectAdd ? 1 : 0)
    }

    if (expectRemoveCount !== undefined) {
      expect(wrapper.find('.delete_condition')).to.have.lengthOf(expectRemoveCount)
    }
  }

  it('renders without items', () => {
    renderAndAssert({
      expectSelect: true,
      expectOptGroupCount: 2,
      expectOptionCount: 5, // four options + placeholder,
      expectAdd: false,
      expectRemoveCount: 0,
    })
  })

  it('renders item with property selected', () => {
    renderAndAssert({
      initialSearchTerms: [{ searchTermId: 'cd_molweight' }],
      expectSelect: false,
      expectAdd: true,
      expectOptGroupCount: 0, // as soon as there's one item selected, groups should be hidden
      expectRemoveCount: 1,
    })
  })

  it('expect selected items are hidden', () => {
    // mount the component with one search item selected and one that's been added but with no selection
    renderAndAssert({
      initialSearchTerms: [
        { searchTermId: 'cd_molweight' },
        {}],
      expectSelect: true,
      expectAdd: false,
      expectRemoveCount: 1,
      expectOptGroupCount: 0, // as soon as there's one item selected, groups should be hidden
      expectOptionCount: 2, // "log_p" + placeholder
    })

    // mount the component with all search items selected in the same group
    renderAndAssert({
      initialSearchTerms: [
        { searchTermId: 'cd_molweight' },
        { searchTermId: 'log_p' }],
      expectSelect: false,
      expectAdd: false, // no more options to add
      expectRemoveCount: 2,
      expectOptGroupCount: 0, // since there should only be one group visible, there shouldn't be groups shown
    })
  })

  it('expect selected but unavailable items are hidden', () => {
    renderAndAssert({
      initialSearchTerms: [
        { searchTermId: 'I am Batman' }], // this should be filtered out
      expectSelect: true,
      expectAdd: false,
      expectRemoveCount: 0,
      expectOptGroupCount: 2,
      expectOptionCount: 5, // placeholder + 4 options
    })
  })
})
