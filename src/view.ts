import { ItemView, WorkspaceLeaf } from 'obsidian'

import { MdxDictionarySettings } from './settings'

export const VIEW_TYPE_MDX_DICT = 'mdx-dict-view'

import { lookup } from './utils'

export class MdxDictionaryView extends ItemView {
  private settings: MdxDictionarySettings
  constructor(leaf: WorkspaceLeaf, settings: MdxDictionarySettings) {
    super(leaf)
    this.settings = settings
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
    root.innerHTML = lookup(this.settings.dictPath, this.settings.word)
  }
  async onClose() {}
}
