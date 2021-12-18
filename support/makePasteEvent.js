const TRANSFER_TYPES = {
  fragment: 'application/x-slate-fragment',
  html: 'text/html',
  node: 'application/x-slate-node',
  rich: 'text/rtf',
  text: 'text/plain',
}

const TRANSFER_TYPES_REMAP = {
  'application/x-slate-fragment': 'fragment',
  'text/html': 'html',
  'application/x-slate-node': 'node',
  'text/rtf': 'rich',
  'text/plain': 'text',
}

export default function makePasteEvent(data = {}) {
  const types = Object.keys(data).map(type => TRANSFER_TYPES[type])
  const getData = type => {
    return data[TRANSFER_TYPES_REMAP[type]]
  }

  const event = {
    preventDefault: () => {},
    clipboardData: {
      getData,
      types,
    },
  }

  return event
}
