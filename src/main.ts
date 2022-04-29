import { App, Editor, Modal, Plugin, Setting, Vault } from 'obsidian'

import { MdxDictionaryView, VIEW_TYPE_MDX_DICT } from './view'
import {
  MdxDictionarySettings,
  MDX_DICTIONARY_DEFAULT_SETTINGS,
  MdxDictionarySettingTab,
} from './settings'

import { lookup } from './utils'

export default class MdxDictionary extends Plugin {
  settings: MdxDictionarySettings

  async onload() {
    await this.loadSettings()
    this.registerView(VIEW_TYPE_MDX_DICT, (leaf) => new MdxDictionaryView(leaf, this.settings))

    this.addSettingTab(new MdxDictionarySettingTab(this.app, this))

    this.addCommand({
      id: 'search-word',
      name: 'Search Word',
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection()
        if (selection !== '') {
          this.settings.word = selection
          this.activateView()
        }
        // else {
        //   new ExampleModal(this.app, this.settings).open()
        // }
      },
      // callback: () => {
      //   this.settings.word = 'fast'
      //   this.activateView()
      // },
    })

    this.addCommand({
      id: 'save-word-to-file',
      name: 'Save Word To File',
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection()
        if (selection !== '') {
          this.settings.word = selection
          this.saveWordToFile()
        }
      },
    })
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MDX_DICT)
  }

  async loadSettings() {
    this.settings = Object.assign({}, MDX_DICTIONARY_DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MDX_DICT)
    await this.app.workspace
      .getRightLeaf(false)
      .setViewState({ type: VIEW_TYPE_MDX_DICT, active: true })
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_MDX_DICT)[0])
  }

  async saveWordToFile() {
    const { vault } = this.app
    vault.create(
      `${this.settings.fileSavePath}/${this.settings.word}.md`,
      lookup(this.settings.dictPath, this.settings.word, this.settings.isSaveAsText)
    )
  }
}

export class ExampleModal extends Modal {
  result: string
  settings: MdxDictionarySettings
  onSubmit(result: string): void {
    this.settings.word = result
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
        .onClick(() => {
          this.close()
          this.onSubmit(this.result)
        })
    )
  }
  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
