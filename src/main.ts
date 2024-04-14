import { Editor, Notice, Plugin } from 'obsidian'

import { MdxDictionaryView, VIEW_TYPE_MDX_DICT } from './ui/view'

import type { MdxDictionarySettings } from './settings'

import { MDX_DICTIONARY_DEFAULT_SETTINGS, MdxDictionarySettingTab } from './settings'

import { SearchWordModal, BatchOutputModal, FileBatchOutputModal } from './ui/modal'

import { activateView, saveWordToFile, checkPathValid, obsidianRel2AbsPath } from './utils'

import MDXServer from './lookup/MDXServer'

import { port } from 'src/config'

export default class MdxDictionary extends Plugin {
  settings: MdxDictionarySettings
  activateView: () => Promise<void>
  saveWordToFile: () => Promise<void>
  server: MDXServer

  async onload() {
    await this.loadSettings()

    this.registerView(VIEW_TYPE_MDX_DICT, (leaf) => new MdxDictionaryView(leaf, this.settings))

    this.addSettingTab(new MdxDictionarySettingTab(this.app, this))

    this.server = new MDXServer(port)
    this.server.loadSetting(this.settings)
    this.server.start()

    this.settings.group.forEach((elem) => {
      this.addCommand({
        id: `search-word-group-${elem.name}`,
        name: `Search Word via Group <${elem.name}>`,
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
        name: `Save Selected Word To File via group <${elem.name}>`,
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

    this.addCommand({
      id: 'batch-output-to-files',
      name: `Batch Output Words to Files`,
      callback: async () => {
        if (this.settings.group.length !== 0) {
          new BatchOutputModal(
            this.app,
            this.settings.group.map((elem) => elem.name),
            (words: Array<string>, groupName: string, path: string) => {
              const groupIdx = this.settings.group.findIndex((elem) =>
                  elem.name === groupName ? true : false
                ),
                group = this.settings.group[groupIdx]
              path = obsidianRel2AbsPath(path)
              this.settings.searchGroup = group
              if (checkPathValid(path)) {
                words.forEach(async (elem) => {
                  this.settings.word = elem
                  await saveWordToFile.call(this, group)
                })
              } else {
                new Notice('Invalid save file path')
              }
            }
          ).open()
        } else {
          new Notice('No group has created')
        }
      },
    })

    this.addCommand({
      id: 'batch-output-to-files-via-file',
      name: `Batch Output Words to Files with Word List selected`,
      callback: async () => {
        if (this.settings.group.length !== 0) {
          new FileBatchOutputModal(
            this.app,
            this.settings.group.map((elem) => elem.name),
            (groupName: string, inputPath: string, outputPath: string) => {
              const groupIdx = this.settings.group.findIndex((elem) =>
                  elem.name === groupName ? true : false
                ),
                group = this.settings.group[groupIdx]
              group
              inputPath = obsidianRel2AbsPath(inputPath)
              outputPath = obsidianRel2AbsPath(outputPath)
              if (checkPathValid(inputPath) && checkPathValid(outputPath)) {
                // TODO read words from vault
                // words.forEach(async (elem) => {
                //   this.settings.word = elem
                //   await saveWordToFile.call(this, group)
                // })
              } else {
                new Notice('Invalid path')
              }
            }
          )
        } else {
          new Notice('No group has created')
        }
      },
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
    this.server.end()
  }

  async loadSettings() {
    this.settings = Object.assign({}, MDX_DICTIONARY_DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
    this.server.loadSetting(this.settings)
  }
}
