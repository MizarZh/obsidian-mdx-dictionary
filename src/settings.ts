import { App, PluginSettingTab, Setting, Editor, Notice } from 'obsidian'

import type MdxDictionary from './main'

import { saveFormatSetting } from './constants'

import type { substituteRule, MDXDictGroup } from './types'

import { activateView, saveWordToFile, randomStringGenerator } from './utils'

import { SearchWordModal, NameChangePrompt } from './ui/modal'

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
  dictPaths: [],
  word: '',

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

    new Setting(this.containerEl)
      .setName('Group General Settings')
      .setDesc(`total group number: ${this.plugin.settings.group.length}`)
      .addButton((cb) => {
        cb.setButtonText('Add new group')
          .setCta()
          .onClick(async () => {
            // remove then add
            this.removeAllCommand()
            const name = randomStringGenerator()
            this.plugin.settings.group.unshift({
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
            this.addAllCommand()
            this.display()
          })
      })

    if (this.plugin.settings.group !== undefined) {
      this.plugin.settings.group.forEach((elem, idx, arr) => {
        // const singleGroup = this.containerEl.createDiv()
        this.containerEl.createEl('hr', { cls: 'mdx-dict-group-hr' })

        const groupName = this.containerEl.createEl('h2', {
          text: `Group ${elem.name}`,
          cls: 'name-change-title',
        })
        groupName.addEventListener('click', (ev) => {
          console.log(ev)
          new NameChangePrompt(this.app, elem.name, async (name: string) => {
            // if already exist the name
            if (arr.some((val) => val.name === name)) {
              new Notice('Name already exist')
            } else if (name === '' || name === undefined) {
              new Notice('Empty group name!')
            } else {
              elem.name = name
              await this.plugin.saveSettings()
              this.display()
            }
          }).open()
        })

        new Setting(this.containerEl)
          .setName('Group management')
          .setDesc('search/save hotkeys and delete')
          .addExtraButton((cb) => {
            cb.setIcon('any-key')
              .setTooltip(`search hotkey for group ${elem.name}`)
              .onClick(() => {
                // unoffical
                // @ts-ignore
                this.app.setting.openTabById('hotkeys')
                // @ts-ignore
                const tab = this.app.setting.activeTab
                tab.searchInputEl.value = 'MDX Dictionary: Search Word via Group ' + elem.name
                tab.updateHotkeyVisibility()
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('any-key')
              .setTooltip(`save hotkey for group ${elem.name}`)
              .onClick(() => {
                // unoffical
                // @ts-ignore
                this.app.setting.openTabById('hotkeys')
                // @ts-ignore
                const tab = this.app.setting.activeTab
                tab.searchInputEl.value =
                  'MDX Dictionary: Save Selected Word To File via Group ' + elem.name
                tab.updateHotkeyVisibility()
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross')
              .setTooltip(`delete group ${elem.name}`)
              .onClick(async () => {
                // remove then add
                this.removeAllCommand()
                this.plugin.settings.group.splice(idx, 1)
                await this.plugin.saveSettings()
                this.addAllCommand()
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
  }

  addPathSetting(group: MDXDictGroup) {
    this.containerEl.createEl('h3', { text: 'dictionary path setting' })
    this.containerEl.createEl('div', {
      text: 'both mdx/mdd files and folders contaning dictionaries are acceptable',
      cls: 'setting-item-description',
    })
    this.containerEl.createEl('div', {
      text: 'when folders are chosen, order of dictionaries is indefinite',
      cls: 'setting-item-description',
    })

    this.containerEl.createEl('br')

    group.dictPaths.forEach((elem, idx) => {
      new Setting(this.containerEl)
        .setName(`Dict / Folder Path ${idx + 1}`)
        .addText((cb) => {
          cb.inputEl.addClass('full-width-input')
          cb.setValue(elem)
            .setPlaceholder('absolute/path/to/your/dict')
            .onChange(async (value) => {
              group.dictPaths[idx] = value
              await this.plugin.saveSettings()
            })
        })
        .addExtraButton((cb) => {
          cb.setIcon('up-chevron-glyph')
            .setTooltip('move up')
            .onClick(async () => {
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
          cb.setIcon('down-chevron-glyph')
            .setTooltip('move down')
            .onClick(async () => {
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
          cb.setIcon('cross')
            .setTooltip('delete path')
            .onClick(async () => {
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
    this.containerEl.createEl('div', {
      text: 'Substitution performed after saving word as a file',
      cls: 'setting-item-description',
    })
    this.containerEl.createEl('br')
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
            cb.setIcon('up-chevron-glyph').setTooltip('move up').onClick(async () => {
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
            cb.setIcon('down-chevron-glyph').setTooltip('move down').onClick(async () => {
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
            cb.setIcon('cross').setTooltip('delete rule').onClick(async () => {
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

  addAllCommand() {
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

  addCommand(elem: MDXDictGroup) {
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
  }

  removeAllCommand() {
    this.plugin.settings.group.forEach((elem) => {
      // unoffical

      // @ts-ignore
      this.app.commands.removeCommand(`${this.plugin.manifest.id}:search-word-group-${elem.name}`)

      // @ts-ignore
      this.app.commands.removeCommand(
        `${this.plugin.manifest.id}:save-selected-word-to-file-group-${elem.name}`
      )
      // @ts-ignore
      // console.log(this.app.commands)
    })
  }
}
