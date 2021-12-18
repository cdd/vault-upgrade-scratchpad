import React, { useState, useEffect } from 'react'
import { render } from 'react-dom'
import { ChemicalPropertiesSearchItem, SearchItem } from './ChemicalPropertiesSearchItem.jsx'

type Props = {
  fields: Object, // { [groupName: string]: { [termId: string] : string } }
  initialSearchTerms?: SearchItem[], // search terms entered by the user
  structure_criterion?: Object, // data that the server sends which we will convert to initialSearchTerms
}

const ChemicalPropertiesSearchComponent = (props: Props) => {
  // the list of criteria that has been added (and which can be removed)
  const [searchTerms, setSearchTerms] = useState(
    (props.initialSearchTerms && props.initialSearchTerms.length) ? props.initialSearchTerms : [{ }]
  )

  useEffect(() => {
    if (props.initialSearchTerms && props.initialSearchTerms.length) {
      setSearchTerms(props.initialSearchTerms)
    }
  }, [props.initialSearchTerms])

  const handleAddTerm = () => {
    const newCriteria = JSON.parse(JSON.stringify(searchTerms))
    newCriteria.push({})
    setSearchTerms(newCriteria)
  }

  const handleRemoveTerm = (index) => {
    if (searchTerms.length === 1) {
      setSearchTerms([{}])
    } else {
      const newCriteria = JSON.parse(JSON.stringify(searchTerms))
      newCriteria.splice(index, 1)
      setSearchTerms(newCriteria)
    }
  }

  const handleChangeItem = (index, newValues) => {
    const newCriteria = JSON.parse(JSON.stringify(searchTerms))
    Object.assign(newCriteria[index], newValues)
    setSearchTerms(newCriteria)
  }

  // filter out any options that were already selected
  let availableOptions = JSON.parse(JSON.stringify(props.fields || []))

  // form a set of all selected terms
  const setUsedSearchTerms = new Set()
  for (let item of searchTerms) {
    setUsedSearchTerms.add(item.searchTermId)
  }

  const allAvailableTerms = new Set() // flattened set of available options (including ones in use)
  const searchTermIdToLabel = {} // flat map of id to labels for search terms
  const searchTermIdToGroup = {} // flat map of id to group name

  // remove any terms in use from the available options
  for (let group in availableOptions) {
    for (let option in availableOptions[group]) {
      allAvailableTerms.add(option)
      searchTermIdToGroup[option] = group
      searchTermIdToLabel[option] = availableOptions[group][option]
      if (setUsedSearchTerms.has(option)) {
        delete availableOptions[group][option]
      }
    }
    // delete any empty groups
    if (!Object.keys(availableOptions[group]).length) {
      delete availableOptions[group]
    }
  }

  // Remove selected terms that aren't in the set of available options. This can happen if the context is
  // changed after a search is run, and the selected option is no longer present,
  const filteredTerms = searchTerms.filter(term => {
    return (!term.searchTermId) || allAvailableTerms.has(term.searchTermId)
  })

  if (filteredTerms.length < searchTerms.length) {
    setSearchTerms(filteredTerms.length ? filteredTerms : [{}])
  }

  // finally, if we have selected a search term from any group, hide all other groups
  if (filteredTerms.length && filteredTerms[0].searchTermId) {
    const selectedGroup = searchTermIdToGroup[filteredTerms[0].searchTermId]
    Object.keys(availableOptions).forEach(group => {
      if (group !== selectedGroup) {
        delete availableOptions[group]
      }
    })
  }

  return (
    <div>
      {searchTerms.map((item, index) => (
        <ChemicalPropertiesSearchItem
          key={index}
          allOptions={props.fields}
          availableOptions={availableOptions}
          items={searchTerms}
          itemIndex={index}
          label={searchTermIdToLabel[item.searchTermId]}
          onAddTerm={handleAddTerm}
          onRemoveTerm={handleRemoveTerm}
          onChangeItem={handleChangeItem}
        />
      ))}
    </div>
  )
}

export default function ChemicalPropertiesSearch(props: Props) {
  // convert options to JSON object if passed in as a string
  if (props.fields && typeof props.fields === 'string') {
    props.fields = JSON.parse(props.fields)
  }

  // convert either an object of key/value pairs (the format from a search) or an array of
  // {name,value} objects (the format from History.restoreFormStateEvent) into a SearchItem[] array
  const convertToInitialSearchTerms = (input) => {
    const result: SearchItem[] = []
    let structure_criterion = input

    // if the input is an array, then convert to an object before extracting properties
    if (Array.isArray(input)) {
      structure_criterion = {}
      const prefix = 'structure_criterion['
      input.forEach(obj => {
        const { name, value } = obj
        if (name && name.startsWith('structure_criterion[')) {
          const key = name.substr(prefix.length, name.length - prefix.length - 1)
          if (key !== 'undefined') {
            structure_criterion[key] = value
          }
        }
      })
    }

    Object.keys(structure_criterion)
      .forEach(key => {
        const searchTermId = key.replace('_minimum', '').replace('_maximum', '')
        let item = result.find(item => (item.searchTermId === searchTermId))
        if (!item) {
          item = { searchTermId }
          result.push(item)
        }
        if (key.endsWith('_minimum')) {
          item.min = structure_criterion[key]
        } else {
          item.max = structure_criterion[key]
        }
      })

    return result
  }

  // convert structure_criterion (object) to initialSearchTerms (array)
  if (props.structure_criterion && !props.initialSearchTerms) {
    props.initialSearchTerms = convertToInitialSearchTerms(props.structure_criterion)
  }

  // render to a specific element if present
  const rootElement = document.getElementById('chemical_properties_react')
  const renderApp = (props) => {
    // don't rely on the previous rootElement value, as the DOM might have been stomped on.
    render(<ChemicalPropertiesSearchComponent {...props} />,
      document.getElementById('chemical_properties_react'))
  }

  if (rootElement) {
    renderApp(props)

    const form = rootElement.closest('form')
    /*
     * The search page caches its form in the History. When restoring, it
     * overwrites the html, so it seems our only recourse is to rerender.
     *
     * Scott suggests eventually replacing this mechanism with persistent stores
     */
    form.addEventListener(CDD.History.restoreFormStateEvent, event => {
      renderApp(props)

      const initialSearchTerms = convertToInitialSearchTerms(event.detail.formData)

      renderApp({ ...props,
        initialSearchTerms: (initialSearchTerms.length ? initialSearchTerms : undefined) })
    })
  } else {
    // otherwise, just render (used in tests)
    return <ChemicalPropertiesSearchComponent {...props}/>
  }
}
