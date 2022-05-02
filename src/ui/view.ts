import { ItemView, WorkspaceLeaf } from 'obsidian'

import type { MdxDictionarySettings } from '../settings'

export const VIEW_TYPE_MDX_DICT = 'mdx-dict-view'

import { lookup } from '../lookup/lookup'

export class MdxDictionaryView extends ItemView {
  private settings: MdxDictionarySettings
  private root: HTMLDivElement
  private container: Element

  async linkOnclick(ev: MouseEvent) {
    ev.preventDefault()
    if (ev.target instanceof HTMLAnchorElement && ev.target.href) {
      console.log(ev.target.href)
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
  async onClose() {}

  update(root: HTMLDivElement, conatiner: Element) {
    conatiner.scrollTop = 0
    root.innerHTML = lookup(
      this.settings.dictPath,
      this.settings.word,
      'html',
      this.settings.showWordNonexistenceNotice
    )
  }
}
