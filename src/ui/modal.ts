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

  constructor(app: App, filename: string, onSubmit: (result: string, vault: Vault) => void) {
    super(app)
    this.onSubmit = onSubmit
    this.setPlaceholder(`Choose an operation on file "${filename}"`)
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

export class NameChangeModal extends Modal {
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

    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.onSubmit(this.name)
        this.close()
      }
    })

    new Setting(contentEl).setName('new group name').addText((text) => {
      text.onChange((value) => {
        this.name = value
      })
    })
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

// export class DeleteConfirm extends Modal {
//   onSubmit: (name: string) => void
// }

export class BatchOutputModal extends Modal {
  private words: Array<string>
  private text: string
  private groupNames: Array<string>
  private groupName: string
  private path: string
  onSubmit: (words: Array<string>, groupName: string, path: string) => void

  constructor(
    app: App,
    groupNames: Array<string>,
    onSubmit: (words: Array<string>, groupName: string, path: string) => void
  ) {
    super(app)
    this.groupNames = groupNames
    this.onSubmit = onSubmit
  }

  // TODO invalid notation in filesystem
  // \ / : * ? " < > | in windows
  onOpen() {
    const { contentEl } = this
    contentEl.createEl('h1', { text: 'Fill in words separated by ","' })

    contentEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        if (this.text === '') {
          new Notice('Empty word input!')
        } else {
          this.onSubmit(this.words, this.groupName, this.path)
        }
        this.close()
      }
    })

    new Setting(contentEl).setName('group').addDropdown((cb) => {
      this.groupNames.forEach((elem) => {
        cb.addOption(elem, elem)
      })
      this.groupName = this.groupNames[0]
      cb.setValue(this.groupNames[0]).onChange((value) => {
        this.groupName = value
      })
    })

    new Setting(contentEl).setName('words').addText((text) => {
      text.inputEl.addClass('full-width-input')
      text.onChange((value) => {
        this.text = value
        this.words = value.split(',')
      })
    })

    new Setting(contentEl).setName('path').addText((text) => {
      text.inputEl.addClass('full-width-input')
      text.onChange((value) => {
        this.path = value
      })
    })
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export class FileBatchOutputModal extends Modal {
  private groupNames: Array<string>
  private groupName: string
  private outputPath: string
  private inputPath: string
  onSubmit: (groupName: string, inputPath: string, outputPath: string) => void

  constructor(
    app: App,
    groupNames: Array<string>,
    onSubmit: (groupName: string, inputPath: string, outputPath: string) => void
  ) {
    super(app)
    this.groupNames = groupNames
    this.onSubmit = onSubmit
  }

  // TODO invalid notation in filesystem, regexp pattern for words
  // \ / : * ? " < > | in windows
  onOpen() {
    const { contentEl } = this
    contentEl.createEl('h1', { text: 'Batch Word (from file) Output' })

    contentEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        this.onSubmit(this.groupName, this.inputPath, this.outputPath)
        this.close()
      }
    })

    new Setting(contentEl).setName('group').addDropdown((cb) => {
      this.groupNames.forEach((elem) => {
        cb.addOption(elem, elem)
      })
      this.groupName = this.groupNames[0]
      cb.setValue(this.groupNames[0]).onChange((value) => {
        this.groupName = value
      })
    })

    new Setting(contentEl).setName('input path').addText((text) => {
      text.inputEl.addClass('full-width-input')
      text.onChange((value) => {
        this.inputPath = value
      })
    })

    new Setting(contentEl).setName('output path').addText((text) => {
      text.inputEl.addClass('full-width-input')
      text.onChange((value) => {
        this.outputPath = value
      })
    })
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
