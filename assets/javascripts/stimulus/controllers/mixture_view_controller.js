import { Controller } from 'stimulus'
import { MixtureViewer } from '@/Molecule/MixtureViewer'

/* eslint-disable no-undef */
export default class extends Controller {
  connect() {
    let img = this.element
    let width = img.offsetWidth, height = img.offsetHeight
    let mixfile_json = img.getAttribute('mixture_mixfile_json')
    if (!mixfile_json) return

    let svg = new MixtureViewer().renderSVG(mixfile_json, width, height)
    if (!svg) return

    let divOuter = document.createElement('div')
    img.parentNode.insertBefore(divOuter, img)

    let disqual1 = img.closest('.molecule-download-copy-popup'), disqual2 = img.closest('#moleculesGrid')
    if (!disqual1 && !disqual2) {
      divOuter.classList.add('molecule-preview-divsvg')
    }

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
