import { App, Modal, Setting } from 'obsidian'

import { VIEW_TYPE_MDX_DICT } from './view'

import { MdxDictionarySettings } from './settings'

export class SearchWordModal extends Modal {
  result: string
  settings: MdxDictionarySettings

  async onSubmit(result: string) {
    this.settings.word = result
    await this.activateView()
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MDX_DICT)
    await this.app.workspace
      .getRightLeaf(false)
      .setViewState({ type: VIEW_TYPE_MDX_DICT, active: true })
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_MDX_DICT)[0])
  }

  constructor(app: App, settings: MdxDictionarySettings) {
    super(app)
    this.settings = settings
  }
  onOpen() {
    const { contentEl } = this
    contentEl.createEl('h1', { text: 'Enter the word you want to search' })
    new Setting(contentEl).setName('Word').addText((text) =>
      text.onChange((value) => {
        this.result = value
      })
    )
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText('Submit')
        .setCta()
        .onClick(async () => {
          this.close()
          await this.onSubmit(this.result)
        })
    )
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
