import { App, PluginSettingTab, Setting, Editor, Notice } from 'obsidian'

import type { DropdownComponent, TextAreaComponent } from 'obsidian'

import type MdxDictionary from './main'

import { saveFormatSetting } from './constants'

import type { MDXDictGroup, MDXServerPathGroup, SaveTemplate, SaveFormat } from './types'

import { randomStringGenerator } from './utils'

import { NameChangeModal } from './ui/modal'

export interface MdxDictionarySettings {
  group: Array<MDXDictGroup> // Dictionary groups
  pathGroup: MDXServerPathGroup // Path groups (object) organized by dictionary name

  showWordNonexistenceNotice: boolean

  word: string // current word
  searchGroup: MDXDictGroup // current dictionary group
}

export const MDX_DICTIONARY_DEFAULT_SETTINGS: Partial<MdxDictionarySettings> = {
  group: [],
}

const saveTemplateDefault: SaveTemplate = {
  markdown: '#{{word}}\n\n---\n{{#for}}\n## {{basename}}\n{{result}}\n\n---\n{{/for}}',
  iframe:
    '<h1>{{word}}</h1>\n<hr><br>\n{{#for}}\n <h2>{{basename}}</h2>\n{{result}}\n<hr><br>{{/for}}',
  raw: '<h1>{{word}}</h1>\n<hr><br>\n{{#for}}\n <h2>{{basename}}</h2>\n{{result}}\n<hr><br>{{/for}}',
  text: '{{word}}\n{{#for}}\n{{basename}}\n{{result}}\n{{/for}}',
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
    new Setting(this.containerEl)
      .setName('Refresh files')
      .setDesc(
        'Refresh if something has changed in the file system (for example a new dictionary is added)'
      )
      .addExtraButton((cb) => {
        cb.setIcon('rotate-ccw').onClick(async () => {
          this.plugin.server.updatePath(this.plugin.settings)
          await this.plugin.saveSettings()
          new Notice('Path updated!')
        })
      })
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
            this.plugin.removeAllCommand()
            const name = randomStringGenerator()
            this.plugin.settings.group.unshift({
              name,
              dictPaths: [''],
              fileSavePath: '',
              saveFormat: 'markdown',
              saveTemplate: Object.assign({}, saveTemplateDefault),
              showNotice: true,
              rules: [],
              hotkeySearch: '',
              hotkeySave: '',
            })
            await this.plugin.saveSettings()
            this.plugin.addAllCommand()
            this.display()
          })
      })

    if (this.plugin.settings.group !== undefined) {
      this.plugin.settings.group.forEach((elem, idx, arr) => {
        // const singleGroup = this.containerEl.createDiv()
        this.containerEl.createEl('hr', { cls: 'mdx-dict-group-hr' })

        const groupName = this.containerEl.createEl('h3', {
          text: `Group ${elem.name}`,
          cls: 'name-change-title',
        })
        groupName.addEventListener('click', (ev) => {
          console.log(ev)
          new NameChangeModal(this.app, elem.name, async (name: string) => {
            // if already exist the name
            this.plugin.removeAllCommand()
            if (arr.some((val) => val.name === name)) {
              new Notice('Name already exist')
            } else if (name === '' || name === undefined) {
              new Notice('Empty group name!')
            } else {
              elem.name = name
              await this.plugin.saveSettings()
              this.display()
            }
            this.plugin.addAllCommand()
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
                tab.searchInputEl.value = `MDX Dictionary: Search Word via Group <${elem.name}>`
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
                tab.searchInputEl.value = `MDX Dictionary: Save Selected Word To File via Group <${elem.name}>`
                tab.updateHotkeyVisibility()
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross')
              .setTooltip(`delete group ${elem.name}`)
              .onClick(async () => {
                // remove then add
                this.plugin.removeAllCommand()
                this.plugin.settings.group.splice(idx, 1)
                await this.plugin.saveSettings()
                this.plugin.addAllCommand()
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

        let saveFormatOption: DropdownComponent, saveTemplateTextArea: TextAreaComponent

        new Setting(this.containerEl)
          .setName('Save format')
          .setDesc('output format when saving a word')
          .addDropdown((cb) => {
            saveFormatOption = cb
            cb.addOptions(saveFormatSetting).setValue(elem.saveFormat)
          })

        new Setting(this.containerEl)
          .setName('Save template')
          .setDesc('template for output text')
          .addTextArea((cb) => {
            saveTemplateTextArea = cb
            cb.inputEl.addClass('save-template')
            cb.setValue(elem.saveTemplate[elem.saveFormat]).onChange(async (value: string) => {
              elem.saveTemplate[elem.saveFormat] = value
              await this.plugin.saveSettings()
            })
          })

        if (saveFormatOption !== null) {
          saveFormatOption.onChange(async (value: SaveFormat) => {
            elem.saveFormat = value
            saveTemplateTextArea.setValue(elem.saveTemplate[elem.saveFormat])
            console.log(value)
            await this.plugin.saveSettings()
          })
        }

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
    this.containerEl.createEl('h4', { text: 'dictionary path setting' })
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
    this.containerEl.createEl('h4', { text: 'Substitute Regexp Settings' })
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
            cb.setIcon('up-chevron-glyph')
              .setTooltip('move up')
              .onClick(async () => {
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
            cb.setIcon('down-chevron-glyph')
              .setTooltip('move down')
              .onClick(async () => {
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
            cb.setIcon('cross')
              .setTooltip('delete rule')
              .onClick(async () => {
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
}
