import { ItemView, WorkspaceLeaf } from 'obsidian'

import { MdxDictionarySettings } from './settings'

export const VIEW_TYPE_MDX_DICT = 'mdx-dict-view'

import Mdict from 'js-mdict'

import { basename } from 'path'

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
    this.containerEl.children[1].innerHTML = this.lookup()
  }
  async onClose() {}

  lookup(): string {
    let result = ''
    const dict = new Mdict(this.settings.dictPath)
    const text = dict.lookup(this.settings.word).definition
    const dictBasename = basename(this.settings.dictPath)
    result += `<h1>${dictBasename}</h1>\n <br>` + text + '\n'
    return result
  }
}