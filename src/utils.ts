import { join } from 'path'

import { statSync } from 'fs'

import { Notice, App, FileSystemAdapter, Vault, TFolder, TFile } from 'obsidian'

import { SaveFileModal } from './ui/modal'

import { VIEW_TYPE_MDX_DICT } from './ui/view'

import { lookup } from './lookup/lookup'

import type { MDXDictGroup } from './types'

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

export async function saveWordToFile(group: MDXDictGroup) {
  if (checkPathValid(obsidianRel2AbsPath(group.fileSavePath))) {
    const { vault } = this.app
    const definition = lookup(
      group.dictPaths,
      this.settings.word,
      group.saveFormat,
      group.showNotice,
      group.rules
    )
    try {
      await vault.create(`${group.fileSavePath}/${this.settings.word}.md`, definition)
    } catch (e) {
      new SaveFileModal(this.app, this.settings.word, async (result: string, vault: Vault) => {
        const fileSaveFolder = vault.getAbstractFileByPath(group.fileSavePath)
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
  } else {
    new Notice('Invalid file save path')
    return
  }
}

export function randomStringGenerator(): string {
  const len = 6,
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    charSetLen = charSet.length
  let randomString = ''
  for (let i = 0; i < len; i++) {
    const randomPoz = Math.floor(Math.random() * charSetLen)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

export function checkPathValid(path: string): boolean {
  try {
    statSync(path)
  } catch (e) {
    return false
  }
  return true
}

export function obsidianRel2AbsPath(relativePath: string) {
  return join(getVaultBasePath(this.app), relativePath)
}
