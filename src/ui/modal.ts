import { App, Modal, Setting, SuggestModal, Notice, Vault } from 'obsidian'

import type { MdxDictionarySettings } from '../settings'

import { suggestSaveFile } from '../constants'

import { activateView, saveWordToFile } from '../utils'

export class SearchWordModal extends Modal {
  result: string
  settings: MdxDictionarySettings
  activateView: () => Promise<void>
  saveWordToFile: () => Promise<void>

  async onSubmit(result: string) {
    this.settings.word = result
    await this.activateView()
  }

  constructor(app: App, settings: MdxDictionarySettings) {
    super(app)
    this.settings = settings
    this.activateView = activateView.bind(this)
    this.saveWordToFile = saveWordToFile.bind(this)
  }
  onOpen() {
    const { contentEl } = this
    contentEl.createEl('h1', { text: 'Enter the word you want to search' })

    contentEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        await this.onSubmit(this.result)
        this.close()
      }
    })

    new Setting(contentEl).setName('Word').addText((text) =>
      text.onChange((value) => {
        this.result = value
      })
    )

    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText('Save as file').onClick(async () => {
          this.close()
          this.settings.word = this.result
          await this.saveWordToFile()
        })
      })
      .addButton((btn) =>
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
