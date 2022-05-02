import Mdict from 'js-mdict'

import { basename, extname, join } from 'path'

import { readdirSync, statSync } from 'fs'

import { Notice, App, FileSystemAdapter, Vault, TFolder, TFile } from 'obsidian'

import { convert } from 'html-to-text'

import { SaveFileModal } from './modal'

import { VIEW_TYPE_MDX_DICT } from './view'

import TurndownService from 'turndown'

const turndownService = new TurndownService()

export function lookup(
  path: string,
  word: string,
  saveFormat: string,
  showWordNonexistenceNotice: boolean
): string {
  let result = `<h1>${word}</h1><br><hr><br>`

  const dictPaths: Array<string> = []
  try {
    statSync(path)
  } catch (e) {
    new Notice('Invalid dictionary path')
    return ''
  }
  const stat = statSync(path)

  // if path points to a folder
  if (stat.isDirectory()) {
    const fileList = readdirSync(path)
    for (const file of fileList) {
      if (extname(file).match(/\.(mdx|mdd)/)) dictPaths.push(join(path, file))
    }
    if (dictPaths.length === 0) {
      new Notice('No mdx/mdd files in the chosen directory')
      return ''
    }
    // if path points to a file
  } else {
    if (extname(path).match(/\.(mdx|mdd)/)) dictPaths.push(path)
    else {
      new Notice('Specified file is not a mdx/mdd file')
      return ''
    }
  }
  // console.log(files)
  for (const path of dictPaths) {
    const dict = new Mdict(path)
    let definition = dict.lookup(word).definition
    // console.log(dict.fuzzy_search(word, 20, 5))
    const dictBasename = basename(path)

    if (definition == null) {
      notice(`Word in dictionary ${dictBasename} does not exist`, showWordNonexistenceNotice)
      definition = 'Word does not exist'
    }
    result += `<h2>${dictBasename}</h2> <br>` + definition + '<br> <hr>'
  }
  console.log(saveFormat)
  if (saveFormat === 'markdown') {
    return turndownService.turndown(result)
  } else if (saveFormat === 'text') {
    return convert(result)
  }
  return result
}

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
