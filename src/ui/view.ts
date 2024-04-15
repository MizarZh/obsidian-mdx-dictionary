import { ItemView, WorkspaceLeaf } from 'obsidian'

import type { MdxDictionarySettings } from '../settings'

export const VIEW_TYPE_MDX_DICT = 'mdx-dict-view'

import { lookup, lookupAll, lookupWebSeparated } from '../lookup/lookup'

// import iframeResizer from 'iframe-resizer/js/iframeResizer'
import { iframeResizer, type IFrameComponent } from 'iframe-resizer'

export class MdxDictionaryView extends ItemView {
  private settings: MdxDictionarySettings
  private root: HTMLDivElement
  private container: Element
  private iframeResize: IFrameComponent[]

  async linkOnclick(ev: MouseEvent) {
    ev.preventDefault()
    if (ev.target instanceof HTMLAnchorElement && ev.target.href) {
      this.settings.word = ev.target.href.match(/^entry:\/\/(.*)/)[1]
      this.update(this.root, this.container)
    }
  }

  constructor(leaf: WorkspaceLeaf, settings: MdxDictionarySettings) {
    super(leaf)
    this.settings = settings
    this.linkOnclick = this.linkOnclick.bind(this)
  }
  getViewType() {
    return VIEW_TYPE_MDX_DICT
  }
  getDisplayText() {
    return 'Mdx Dict View'
  }
  async onOpen() {
    const container = this.containerEl.children[1]
    container.empty()
    const root = container.createEl('div', { cls: 'mdx-dict-sidebar' })

    this.container = container
    this.root = root
    this.update(this.root, this.container)

    root.addEventListener('click', this.linkOnclick)
  }
  async onClose() {
    for (const x of this.iframeResize) {
      x.iFrameResizer.close()
    }
  }

  update(root: HTMLDivElement, conatiner: Element) {
    conatiner.scrollTop = 0
    // root.innerHTML = lookup(
    //   this.settings.searchGroup.dictPaths,
    //   this.settings.word,
    //   'html',
    //   this.settings.searchGroup.showNotice,
    //   []
    // )
    root.innerHTML = lookupWebSeparated(
      this.settings.word,
      this.settings.pathGroup[this.settings.searchGroup.name],
      this.settings.searchGroup.saveTemplate['iframe'],
      'word-definition-results'
    )

    // set iframe resizer
    this.iframeResize = iframeResizer(
      {
        log: false,
      },
      '.word-definition-results'
    )
    // if width of div changed, then resize every iframe
    new ResizeObserver(() => {
      for (const x of this.iframeResize) {
        x.iFrameResizer.resize()
      }
    }).observe(root)
  }
}
