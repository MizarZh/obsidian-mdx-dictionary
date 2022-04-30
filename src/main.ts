import { Editor, Plugin, TFile, TFolder, Notice } from 'obsidian'

import { MdxDictionaryView, VIEW_TYPE_MDX_DICT } from './view'

import {
  MdxDictionarySettings,
  MDX_DICTIONARY_DEFAULT_SETTINGS,
  MdxDictionarySettingTab,
} from './settings'

import { SearchWordModal } from './modal'

import { lookup } from './utils'

import { statSync } from 'fs'

export default class MdxDictionary extends Plugin {
  settings: MdxDictionarySettings

  async onload() {
    await this.loadSettings()
    this.registerView(VIEW_TYPE_MDX_DICT, (leaf) => new MdxDictionaryView(leaf, this.settings))

    this.addSettingTab(new MdxDictionarySettingTab(this.app, this))

    this.addCommand({
      id: 'search-word',
      name: 'Search word',
      callback: async () => {
        new SearchWordModal(this.app, this.settings).open()
      },
    })

    this.addCommand({
      id: 'search-selected-word',
      name: 'Search Selected Word',
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection()
        if (selection !== '') {
          this.settings.word = selection
          await this.activateView()
        } else {
          new Notice('Nothing is selected!')
        }
      },
    })

    this.addCommand({
      id: 'save-selected-word-to-file',
      name: 'Save Selected Word To File',
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection()
        if (selection !== '') {
          this.settings.word = selection
          await this.saveWordToFile()
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
    const definition = lookup(
      this.settings.dictPath,
      this.settings.word,
      this.settings.isSaveAsText,
      this.settings.showWordNonexistenceNotice
    )

    try {
      statSync(this.settings.fileSavePath)
    } catch (e) {
      new Notice('Invalid file save path')
      return
    }

    try {
      await vault.create(`${this.settings.fileSavePath}/${this.settings.word}.md`, definition)
    } catch (e) {
      const fileSaveFolder = vault.getAbstractFileByPath(this.settings.fileSavePath)
      if (fileSaveFolder instanceof TFolder) {
        for (const wordFile of fileSaveFolder.children) {
          if (wordFile instanceof TFile && wordFile.basename === this.settings.word) {
            await vault.modify(wordFile, definition)
            break
          }
        }
      }
    }
  }
}
