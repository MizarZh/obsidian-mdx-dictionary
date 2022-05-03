import { App, Modal, Setting, SuggestModal, Notice, Vault } from 'obsidian'

import type { MdxDictionarySettings } from '../settings'

import { suggestSaveFile } from '../constants'

import { activateView, saveWordToFile } from '../utils'

import type { MDXDictGroup } from 'src/types'

export class SearchWordModal extends Modal {
  private result: string
  private settings: MdxDictionarySettings
  private group: MDXDictGroup

  async onSubmit(result: string) {
    this.settings.word = result
    await activateView.call(this)
  }

  constructor(app: App, settings: MdxDictionarySettings, group: MDXDictGroup) {
    super(app)
    this.settings = settings
    this.group = group
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
          await saveWordToFile.call(this, this.group)
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

export class NameChangePrompt extends Modal {
  originalName: string
  name: string
  onSubmit: (name: string) => void

  constructor(app: App, originalName: string, onSubmit: (name: string) => void) {
    super(app)
    this.originalName = originalName
    this.onSubmit = onSubmit
  }
  onOpen() {
    const { contentEl } = this
    contentEl.createEl('h2', { text: `Change name for group ${this.originalName}` })

    contentEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        this.onSubmit(this.name)
        this.close()
      }
    })

    new Setting(contentEl).addText((text) =>
      text.onChange((value) => {
        this.name = value
      })
    )
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
