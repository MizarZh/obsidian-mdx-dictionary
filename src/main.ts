import { Editor, Plugin } from 'obsidian'

import { MdxDictionaryView, VIEW_TYPE_MDX_DICT } from './ui/view'

import type { MdxDictionarySettings } from './settings'

import { MDX_DICTIONARY_DEFAULT_SETTINGS, MdxDictionarySettingTab } from './settings'

import { SearchWordModal } from './ui/modal'

import { activateView, saveWordToFile } from './utils'

export default class MdxDictionary extends Plugin {
  settings: MdxDictionarySettings
  activateView: () => Promise<void>
  saveWordToFile: () => Promise<void>

  async onload() {
    await this.loadSettings()
    this.registerView(VIEW_TYPE_MDX_DICT, (leaf) => new MdxDictionaryView(leaf, this.settings))

    this.addSettingTab(new MdxDictionarySettingTab(this.app, this))

    this.settings.group.forEach((elem) => {
      this.addCommand({
        id: `search-word-group-${elem.name}`,
        name: `Search Word via Group ${elem.name}`,
        editorCallback: async (editor: Editor) => {
          const selection = editor.getSelection()
          if (selection !== '') {
            this.settings.word = selection
            this.settings.searchGroup = elem
            await activateView.call(this, elem)
          } else {
            new SearchWordModal(this.app, this.settings, elem).open()
          }
        },
      })

      this.addCommand({
        id: `save-selected-word-to-file-group-${elem.name}`,
        name: `Save Selected Word To File via group ${elem.name}`,
        editorCallback: async (editor: Editor) => {
          const selection = editor.getSelection()
          if (selection !== '') {
            this.settings.word = selection
            this.settings.searchGroup = elem
            await saveWordToFile.call(this, elem)
          }
        },
      })
    })

    // this.activateView = activateView.bind(this)
    // this.saveWordToFile = saveWordToFile.bind(this)

    // this.addCommand({
    //   id: 'search-word',
    //   name: 'Search Word',
    //   editorCallback: async (editor: Editor) => {
    //     const selection = editor.getSelection()
    //     if (selection !== '') {
    //       this.settings.word = selection
    //       await this.activateView()
    //     } else {
    //       new SearchWordModal(this.app, this.settings).open()
    //     }
    //   },
    // })

    // this.addCommand({
    //   id: 'save-selected-word-to-file',
    //   name: 'Save Selected Word To File',
    //   editorCallback: async (editor: Editor) => {
    //     const selection = editor.getSelection()
    //     if (selection !== '') {
    //       this.settings.word = selection
    //       await this.saveWordToFile()
    //     }
    //   },
    // })
    // @ts-ignore
    // console.log(this.app.commands)
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
}
