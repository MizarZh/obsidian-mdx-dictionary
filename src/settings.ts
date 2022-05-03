import { App, PluginSettingTab, Setting } from 'obsidian'

import type MdxDictionary from './main'

import { saveFormatSetting } from './constants'

import type { substituteRule, MDXDictGroup } from './types'

export interface MdxDictionarySettings {
  dictPaths: Array<string>
  fileSavePath: string

  saveFormat: string
  transformRules: Array<substituteRule>

  group: MDXDictGroup

  showWordNonexistenceNotice: boolean

  word: string
}

export const MDX_DICTIONARY_DEFAULT_SETTINGS: Partial<MdxDictionarySettings> = {
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
    this.addGeneralHeader()
    this.addGeneralSetting()
    this.addSubstituteHeader()
    this.addSubstituteSetting()
  }
  addGeneralHeader() {
    this.containerEl.createEl('h2', { text: 'General Settings' })
  }

  addGeneralSetting() {
    if (this.plugin.settings.dictPaths !== undefined) {
      this.plugin.settings.dictPaths.forEach((elem, idx) => {
        new Setting(this.containerEl)
          .setName(`Dict / Folder Path ${idx + 1}`)
          .addText((cb) => {
            cb.setValue(elem)
              .setPlaceholder('absolute/path/to/your/dict')
              .onChange(async (value) => {
                this.plugin.settings.dictPaths[idx] = value
                await this.plugin.saveSettings()
              })
          })
          .addExtraButton((cb) => {
            cb.setIcon('up-chevron-glyph').onClick(async () => {
              if (idx > 0) {
                const temp = this.plugin.settings.dictPaths[idx]
                this.plugin.settings.dictPaths[idx] = this.plugin.settings.dictPaths[idx - 1]
                this.plugin.settings.dictPaths[idx - 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph').onClick(async () => {
              if (idx < this.plugin.settings.dictPaths.length - 1) {
                const temp = this.plugin.settings.dictPaths[idx]
                this.plugin.settings.dictPaths[idx] = this.plugin.settings.dictPaths[idx + 1]
                this.plugin.settings.dictPaths[idx + 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross').onClick(async () => {
              this.plugin.settings.dictPaths.splice(idx, 1)
              await this.plugin.saveSettings()
              this.display()
            })
          })
      })
    }
    new Setting(this.containerEl).addButton((cb) => {
      cb.setButtonText('Add new dictionary path')
        .setCta()
        .onClick(async () => {
          this.plugin.settings.dictPaths.push('')
          await this.plugin.saveSettings()
          this.display()
        })
    })

    new Setting(this.containerEl)
      .setName('File Save Path')
      .setDesc('with respect to current vault')
      .addText((text) => {
        text
          .setPlaceholder('path/to/your/file')
          .setValue(this.plugin.settings.fileSavePath)
          .onChange(async (value) => {
            this.plugin.settings.fileSavePath = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(this.containerEl)
      .setName('Save Word As markdown')
      .setDesc('save word as markdown format rather than html')
      .addDropdown((cb) => {
        cb.addOptions(saveFormatSetting)
          .setValue(this.plugin.settings.saveFormat)
          .onChange(async (value) => {
            this.plugin.settings.saveFormat = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(this.containerEl)
      .setName('Show Word Notices')
      .setDesc('')
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.showWordNonexistenceNotice).onChange(async (value) => {
          this.plugin.settings.showWordNonexistenceNotice = value
          await this.plugin.saveSettings()
        })
      })
  }
  addSubstituteHeader() {
    this.containerEl.createEl('h2', { text: 'Substitute Regexp Settings' })
    this.containerEl.createEl('p', { text: 'Substitution performed after saving word as a file' })
  }
  addSubstituteSetting() {
    if (this.plugin.settings.transformRules !== undefined) {
      this.plugin.settings.transformRules.forEach((elem, idx) => {
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
                const temp = this.plugin.settings.transformRules[idx]
                this.plugin.settings.transformRules[idx] =
                  this.plugin.settings.transformRules[idx - 1]
                this.plugin.settings.transformRules[idx - 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph').onClick(async () => {
              if (idx < this.plugin.settings.transformRules.length - 1) {
                const temp = this.plugin.settings.transformRules[idx]
                this.plugin.settings.transformRules[idx] =
                  this.plugin.settings.transformRules[idx + 1]
                this.plugin.settings.transformRules[idx + 1] = temp
              }
              await this.plugin.saveSettings()
              this.display()
            })
          })
          .addExtraButton((cb) => {
            cb.setIcon('cross').onClick(async () => {
              this.plugin.settings.transformRules.splice(idx, 1)
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
          this.plugin.settings.transformRules.push({
            rule: '',
            substitute: '',
          })
          await this.plugin.saveSettings()
          this.display()
        })
    })
  }
}
