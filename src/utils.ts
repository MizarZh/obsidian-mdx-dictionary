import { join } from 'path'

import { statSync } from 'fs'

import { Notice, App, FileSystemAdapter, Vault, TFolder, TFile } from 'obsidian'

import { SaveFileModal } from './ui/modal'

import { VIEW_TYPE_MDX_DICT } from './ui/view'

import { lookup } from './lookup/lookup'

// flag = true means notice will show
export function notice(text: string, flag: boolean) {
  if (flag) new Notice(text)
}

export const getVaultBasePath = function (app: App) {
  const adapter = app.vault.adapter
  if (adapter instanceof FileSystemAdapter) {
    return adapter.getBasePath()
  }
  return null
}

export async function activateView() {
  this.app.workspace.detachLeavesOfType(VIEW_TYPE_MDX_DICT)
  await this.app.workspace
    .getRightLeaf(false)
    .setViewState({ type: VIEW_TYPE_MDX_DICT, active: true })
  this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_MDX_DICT)[0])
}

export async function saveWordToFile() {
  const { vault } = this.app
  const definition = lookup(
    this.settings.dictPath,
    this.settings.word,
    this.settings.saveFormat,
    this.settings.showWordNonexistenceNotice
  )

  try {
    const basePath = getVaultBasePath(this.app)
    statSync(join(basePath, this.settings.fileSavePath))
  } catch (e) {
    new Notice('Invalid file save path')
    return
  }

  try {
    await vault.create(`${this.settings.fileSavePath}/${this.settings.word}.md`, definition)
  } catch (e) {
    new SaveFileModal(this.app, async (result: string, vault: Vault) => {
      const fileSaveFolder = vault.getAbstractFileByPath(this.settings.fileSavePath)
      if (fileSaveFolder instanceof TFolder) {
        for (const wordFile of fileSaveFolder.children) {
          if (wordFile instanceof TFile && wordFile.basename === this.settings.word) {
            if (result === 'append') {
              await vault.append(wordFile, definition)
            } else if (result === 'overwrite') {
              await vault.modify(wordFile, definition)
            }
            break
          }
        }
      }
    }).open()
  }
}
