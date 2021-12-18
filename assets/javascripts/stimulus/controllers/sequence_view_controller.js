import { Controller } from 'stimulus'
import { SequenceViewer } from '@/Molecule/SequenceViewer'

export default class extends Controller {
  connect() {
    let img = this.element
    let width = img.offsetWidth, height = img.offsetHeight

    let nucleotide = img.getAttribute('nucleotide_sequence')
    let aminoacid = img.getAttribute('amino_acid_sequence')
    if (!nucleotide && !aminoacid) return

    let seqv = new SequenceViewer(width, height)
    let svg = nucleotide ? seqv.renderNucleotide(nucleotide) : seqv.renderAminoAcid(aminoacid)

    let divOuter = document.createElement('div')
    img.parentNode.insertBefore(divOuter, img)

    let divInner = document.createElement('div')
    divOuter.appendChild(divInner)
    divInner.style.width = `${width}px`
    divInner.style.height = `${height}px`
    divInner.style.display = 'block'
    divInner.style.pointerEvents = 'none'

    let elSVG = document.createElement('svg')
    divInner.appendChild(elSVG)
    /* eslint-disable no-unsafe-innerhtml/no-unsafe-innerhtml */
    elSVG.outerHTML = svg

    img.remove()
  }
}
