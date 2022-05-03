import { App, PluginSettingTab, Setting, Editor } from 'obsidian'

import type MdxDictionary from './main'

import { saveFormatSetting } from './constants'

import type { substituteRule, MDXDictGroup } from './types'

import { activateView, saveWordToFile, randomStringGenerator } from './utils'

import { SearchWordModal } from './ui/modal'

export interface MdxDictionarySettings {
  dictPaths: Array<string>
  fileSavePath: string

  saveFormat: string
  transformRules: Array<substituteRule>

  group: Array<MDXDictGroup>

  showWordNonexistenceNotice: boolean

  word: string
  searchGroup: MDXDictGroup
}

export const MDX_DICTIONARY_DEFAULT_SETTINGS: Partial<MdxDictionarySettings> = {
  group: [],
  // {
  //   dictPaths: [],
  //   fileSavePath: '',
  //   saveFormat: '',
  //   showNotice: true,
  //   rules: [],
  //   hotkeySearch: '',
  //   hotkeySave: '',
  // },
  dictPaths: [],
  word: 'test',

  transformRules: [],

  saveFormat: 'markdown',
  showWordNonexistenceNotice: false,
}

export class MdxDictionarySettingTab extends PluginSettingTab {
  plugin: MdxDictionary

  constructor(app: App, plugin: MdxDictionary) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    this.containerEl.empty()
    this.addGeneralSetting()
    this.addGroupSetting()
  }

  addGeneralSetting() {
    this.containerEl.createEl('h1', { text: 'General Settings' })
    // this.addGroupSetting()
  }

  addGroupSetting() {
    this.containerEl.createEl('h1', { text: 'Group Settings' })
    if (this.plugin.settings.group !== undefined) {
      this.plugin.settings.group.forEach((elem, idx) => {
        this.containerEl.createEl('h2', { text: `Group ${elem.name}` })

        new Setting(this.containerEl)
          .setName('Group management')
          .setDesc('search/save hotkeys and delete')
          .addExtraButton((cb) => {
            cb.setIcon('any-key')
              .setTooltip(`search hotkey for group ${elem.name}`)
              .onClick(() => {
                // elem.hotkeySearch =
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('any-key')
              .setTooltip(`save hotkey for group ${elem.name}`)
              .onClick(() => {})
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross')
              .setTooltip(`delete group ${elem.name}`)
              .onClick(async () => {
                // remove then add
                this.removeCommand()
                this.plugin.settings.group.splice(idx, 1)
                await this.plugin.saveSettings()
                this.addCommand()
                this.display()
              })
          })

        this.addPathSetting(elem)

        new Setting(this.containerEl)
          .setName('File Save Path')
          .setDesc('with respect to current vault')
          .addText((text) => {
            text
              .setPlaceholder('path/to/your/file')
              .setValue(elem.fileSavePath)
              .onChange(async (value) => {
                elem.fileSavePath = value
                await this.plugin.saveSettings()
              })
          })

        new Setting(this.containerEl)
          .setName('Save Word As markdown')
          .setDesc('save word as markdown format rather than html')
          .addDropdown((cb) => {
            cb.addOptions(saveFormatSetting)
              .setValue(elem.saveFormat)
              .onChange(async (value) => {
                elem.saveFormat = value
                await this.plugin.saveSettings()
              })
          })

        new Setting(this.containerEl)
          .setName('Show Word Notices')
          .setDesc('')
          .addToggle((cb) => {
            cb.setValue(elem.showNotice).onChange(async (value) => {
              elem.showNotice = value
              await this.plugin.saveSettings()
            })
          })

        this.addSubstituteSetting(elem)
      })
    }

    new Setting(this.containerEl).addButton((cb) => {
      cb.setButtonText('Add new group')
        .setCta()
        .onClick(async () => {
          // remove then add
          this.removeCommand()
          const name = randomStringGenerator()
          this.plugin.settings.group.push({
            name,
            dictPaths: [''],
            fileSavePath: '',
            saveFormat: 'markdown',
            showNotice: true,
            rules: [],
            hotkeySearch: '',
            hotkeySave: '',
          })
          await this.plugin.saveSettings()
          this.addCommand()
          this.display()
        })
    })
  }

  addPathSetting(group: MDXDictGroup) {
    this.containerEl.createEl('h3', { text: 'dictionary path setting' })

    group.dictPaths.forEach((elem, idx) => {
      new Setting(this.containerEl)
        .setName(`Dict / Folder Path ${idx + 1}`)
        .addText((cb) => {
          cb.setValue(elem)
            .setPlaceholder('absolute/path/to/your/dict')
            .onChange(async (value) => {
              group.dictPaths[idx] = value
              await this.plugin.saveSettings()
            })
        })
        .addExtraButton((cb) => {
          cb.setIcon('up-chevron-glyph').onClick(async () => {
            if (idx > 0) {
              const temp = group.dictPaths[idx]
              group.dictPaths[idx] = group.dictPaths[idx - 1]
              group.dictPaths[idx - 1] = temp
            }
            await this.plugin.saveSettings()
            this.display()
          })
        })
        .addExtraButton((cb) => {
          cb.setIcon('down-chevron-glyph').onClick(async () => {
            if (idx < group.dictPaths.length - 1) {
              const temp = group.dictPaths[idx]
              group.dictPaths[idx] = group.dictPaths[idx + 1]
              group.dictPaths[idx + 1] = temp
            }
            await this.plugin.saveSettings()
            this.display()
          })
        })
        .addExtraButton((cb) => {
          cb.setIcon('cross').onClick(async () => {
            group.dictPaths.splice(idx, 1)
            await this.plugin.saveSettings()
            this.display()
          })
        })
    })

    new Setting(this.containerEl).addButton((cb) => {
      cb.setButtonText('Add new dictionary path')
        .setCta()
        .onClick(async () => {
          group.dictPaths.push('')
          await this.plugin.saveSettings()
          this.display()
        })
    })
  }

  addSubstituteSetting(group: MDXDictGroup) {
    this.containerEl.createEl('h3', { text: 'Substitute Regexp Settings' })
    this.containerEl.createEl('p', { text: 'Substitution performed after saving word as a file' })
    if (group.rules !== undefined) {
      group.rules.forEach((elem, idx) => {
        new Setting(this.containerEl)
          .setClass('margin-text-input')
          .setName(`Rule ${idx + 1}`)
          .addText((cb) => {
            cb.setValue(elem.rule)
              .setPlaceholder('pattern (in RegExp)')
              .onChange(async (value) => {
                elem.rule = value
                await this.plugin.saveSettings()
              })
          })
          .addText((cb) => {
            cb.setValue(elem.substitute)
              .setPlaceholder('substitution')
              .onChange(async (value) => {
                elem.substitute = value
                await this.plugin.saveSettings()
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('up-chevron-glyph').onClick(async () => {
              if (idx > 0) {
                const temp = group.rules[idx]
                group.rules[idx] = group.rules[idx - 1]
                group.rules[idx - 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph').onClick(async () => {
              if (idx < group.rules.length - 1) {
                const temp = group.rules[idx]
                group.rules[idx] = group.rules[idx + 1]
                group.rules[idx + 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross').onClick(async () => {
              group.rules.splice(idx, 1)
              await this.plugin.saveSettings()
              this.display()
            })
          })
      })
    }

    new Setting(this.containerEl).addButton((cb) => {
      cb.setButtonText('Add new rule')
        .setCta()
        .onClick(async () => {
          group.rules.push({
            rule: '',
            substitute: '',
          })
          await this.plugin.saveSettings()
          this.display()
        })
    })
  }

  addCommand() {
    this.plugin.settings.group.forEach((elem) => {
      this.plugin.addCommand({
        id: `search-word-group-${elem.name}`,
        name: `Search Word via Group ${elem.name}`,
        editorCallback: async (editor: Editor) => {
          const selection = editor.getSelection()
          if (selection !== '') {
            this.plugin.settings.word = selection
            this.plugin.settings.searchGroup = elem
            await activateView.call(this.plugin, elem)
          } else {
            new SearchWordModal(this.app, this.plugin.settings, elem).open()
          }
        },
      })

      this.plugin.addCommand({
        id: `save-selected-word-to-file-group-${elem.name}`,
        name: `Save Selected Word To File via group ${elem.name}`,
        editorCallback: async (editor: Editor) => {
          const selection = editor.getSelection()
          if (selection !== '') {
            this.plugin.settings.word = selection
            this.plugin.settings.searchGroup = elem
            await saveWordToFile.call(this.plugin, elem)
          }
        },
      })
    })
  }

  removeCommand() {
    this.plugin.settings.group.forEach((elem) => {
      // unoffical

      // @ts-ignore
      this.app.commands.removeCommand(`${this.plugin.manifest.id}:search-word-group-${elem.name}`)

      // @ts-ignore
      this.app.commands.removeCommand(
        `${this.plugin.manifest.id}:save-selected-word-to-file-group-${elem.name}`
      )
      // @ts-ignore
      console.log(this.app.commands)
    })
  }
}
