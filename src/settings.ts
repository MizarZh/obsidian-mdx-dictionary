import { App, PluginSettingTab, Setting } from 'obsidian'

import type MdxDictionary from './main'

import { saveFormatSetting } from './constants'

import type { transformRule } from './types'

export interface MdxDictionarySettings {
  dictPath: string
  fileSavePath: string

  saveFormat: string
  transformRules: Array<transformRule>

  showWordNonexistenceNotice: boolean

  word: string
}

export const MDX_DICTIONARY_DEFAULT_SETTINGS: Partial<MdxDictionarySettings> = {
  dictPath: 'C:/',
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
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'General Settings' })

    new Setting(containerEl)
      .setName('Dictionary or Folder Path')
      .setDesc('absolute path to your dictionary or folder containing them')
      .addText((text) => {
        text
          .setPlaceholder('path/to/your/dictionary')
          .setValue(this.plugin.settings.dictPath)
          .onChange(async (value) => {
            this.plugin.settings.dictPath = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
      .setName('Show Word Notices')
      .setDesc('')
      .addToggle((cb) => {
        cb.setValue(this.plugin.settings.showWordNonexistenceNotice).onChange(async (value) => {
          this.plugin.settings.showWordNonexistenceNotice = value
          await this.plugin.saveSettings()
        })
      })

    containerEl.createEl('h2', { text: 'Substitute Regexp Settings' })
    containerEl.createEl('p', { text: 'Substitution performed after saving word as a file' })

    if (this.plugin.settings.transformRules !== undefined) {
      this.plugin.settings.transformRules.forEach((elem, idx) => {
        new Setting(containerEl)
          .setClass('margin-text-input')
          .setName(`Rule ${idx+1}`)
          .addText((cb) => {
            cb.setValue(elem.rule).onChange(async (value) => {
              elem.rule = value
              await this.plugin.saveSettings()
            })
          })
          .addText((cb) => {
            cb.setValue(elem.substitute).onChange(async (value) => {
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

    new Setting(containerEl).addButton((cb) => {
      cb.setButtonText('Add rules')
        .setCta()
        .onClick(() => {
          this.plugin.settings.transformRules.push({
            rule: '',
            substitute: '',
          })
          this.display()
        })
    })
  }
}
