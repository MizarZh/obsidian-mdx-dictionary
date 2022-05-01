import { App, Modal, Setting, SuggestModal, Notice, Vault } from 'obsidian'

import { VIEW_TYPE_MDX_DICT } from './view'

import { MdxDictionarySettings } from './settings'

import { suggestSaveFile } from './constants'

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

interface SaveFileOptions {
  title: string
  operation: string
}

export class SaveFileModal extends SuggestModal<SaveFileOptions> {
  onSubmit: (result: string, vault: Vault) => void

  constructor(app: App, onSubmit: (result: string, vault: Vault) => void) {
    super(app)
    this.onSubmit = onSubmit
  }

  getSuggestions(query: string): SaveFileOptions[] {
    return suggestSaveFile.filter((option) =>
      option.title.toLowerCase().includes(query.toLowerCase())
    )
  }

  renderSuggestion(suggestSaveFile: SaveFileOptions, el: HTMLElement) {
    el.createEl('div', { text: suggestSaveFile.title })
  }

  onChooseSuggestion(suggestSaveFile: SaveFileOptions, evt: MouseEvent | KeyboardEvent) {
    this.onSubmit(suggestSaveFile.operation, this.app.vault)
    new Notice(`${suggestSaveFile.title}`)
  }
}
