import React from 'react'
// import { Img } from '@/shared/components/sanitizedTags.js'

// import deleteIcon from 'ASSETS/images/cdd30/icons/delete.png'
// import addIcon from 'ASSETS/images/cdd30/icons/add.png'

/**
 * Simple model for user added terms
 */
export type SearchItem = {
  searchTermId: string,
  min: number,
  max: number
}

/**
 * Component to render an individual search term
 */
const addRemoveRowStyle = { height: 18 }

type Props = {
  availableOptions: Object,
  items: SearchItem[],
  itemIndex: number,
  label: string,
  onAddTerm: () => void,
  onRemoveTerm: (index: number) => void,
  onChangeItem: (index: number, changedFields: Object) => void
}

export const ChemicalPropertiesSearchItem = (props: Props) => {
  const {
    availableOptions, // list of only the available options for new items
    items,
    itemIndex, // the index of the item that we are rendering
    label,
    onAddTerm, // callback when Add Term button is clicked
    onRemoveTerm,
    onChangeItem,
  } = props

  const item = items[itemIndex]

  const handleChangeSelect = (e: React.ChangeEvent) => {
    onChangeItem(itemIndex, { searchTermId: e.target.value })
  }

  const handleChangeItemMin = (e: React.ChangeEvent) => {
    onChangeItem(itemIndex, { min: e.target.valueAsNumber })
  }

  const handleChangeItemMax = (e: React.ChangeEvent) => {
    onChangeItem(itemIndex, { max: e.target.valueAsNumber })
  }

  const showRemove = !!item.searchTermId
  const showAnd = item.searchTermId && itemIndex < (items.length - 1) && items[itemIndex + 1].searchTermId
  const showAddItem = (Object.keys(availableOptions).length > 0) &&
    item.searchTermId && itemIndex === (items.length - 1) && items[itemIndex].searchTermId
  const shouldAutoFocus = item.searchTermId && itemIndex === (items.length - 1)

  let selectOptions = [] // contents of the select tag, either wrapped in optgroup or not

  if (!label) {
    Object.keys(availableOptions).forEach((group) => {
      const options = Object.keys(availableOptions[group]).map((option) => (
        <option key={option} value={option}>
          {availableOptions[group][option]}
        </option>
      ))
      if (Object.keys(availableOptions).length > 1) {
        // if more than one group, wrap in an <optgroup> tag
        selectOptions.push(<optgroup key={group} label={group}>
          {options}
        </optgroup>)
      } else {
        selectOptions = options
      }
    })
  }

  return <div>
    <div className='condition'>
      <div className='dropdown_row name_and_type'>

        {label && <div className='chemical_property_name'>{label}</div>}

        {!label &&
          <select
            name='property_selection'
            id='property_selection'
            className='chemical_property_select'
            value={item.searchTermId || ''}
            onChange={handleChangeSelect}>
            <option value='' hidden disabled>(select property)</option>
            {selectOptions}</select>}

        <div className='chemical_property_values'>
          <label>
            <input size={8} maxLength={15} className='input-text' type='number'
              autoFocus={shouldAutoFocus}
              value={item.min === undefined ? '' : item.min}
              onChange={handleChangeItemMin}
              placeholder='Min'
              name={`structure_criterion[${item.searchTermId}_minimum]`}
              id={`structure_criterion_${item.searchTermId}_minimum`} />
          </label>
          <label>
            <input size={8} maxLength={15} className='input-text' type='number'
              value={item.max === undefined ? '' : item.max}
              onChange={handleChangeItemMax}
              placeholder='Max'
              name={`structure_criterion[${item.searchTermId}_maximum]`}
              id={`structure_criterion_${item.searchTermId}_maximum`} />
          </label>
        </div>
      </div>
      <div className='clear'></div>
    </div>

    {(showRemove || showAnd || showAddItem) &&

      <div style={addRemoveRowStyle}>
        {showAnd && <span className='chemical_property_junction'>and</span>}
        {showAddItem &&
          <a id='chemical_properties_criterion_add_link'
            onClick={onAddTerm}>
            {/* <Img
              width={16} height={16} className='icon-16' alt='Add'
              src={addIcon} /> */}
            Add a term
          </a>}

        {showRemove && <div className='delete_condition'>
          <a className='cancel' id={`chemical_properties_criterion_${item.searchTermId}_remove_link`}
            onClick={() => onRemoveTerm(itemIndex)}>
            {/* <Img
              width={16} height={16} className='icon-16' alt='Delete'
              src={deleteIcon} /> */}
            Remove term
          </a>
        </div>}
      </div>}
  </div>
}
