import { App, PluginSettingTab, Setting } from 'obsidian'

import MdxDictionary from './main'

export interface MdxDictionarySettings {
  dictPath: string
  word: string
}

export const MDX_DICTIONARY_DEFAULT_SETTINGS: Partial<MdxDictionarySettings> = {
  dictPath: 'C:/',
  word: 'test'
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

    new Setting(containerEl)
      .setName('Dictionary Path')
      .setDesc('Dictionary Path')
      .addText((text) => {
        text
          .setPlaceholder('path/to/your/dictionary')
          .setValue(this.plugin.settings.dictPath)
          .onChange(async (value) => {
            this.plugin.settings.dictPath = value
            await this.plugin.saveSettings()
          })
      })
  }
}
