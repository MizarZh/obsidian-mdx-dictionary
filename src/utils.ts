import Mdict from 'js-mdict'

import { basename, extname, join } from 'path'

import { readdirSync, statSync } from 'fs'

import { Notice } from 'obsidian'

// import { convert } from 'html-to-text'

import TurndownService from 'turndown'

const turndownService = new TurndownService()

export function lookup(path: string, word: string, isText: boolean): string {
  let result = ''

  const dictPaths: Array<string> = []
  try {
    statSync(path)
  } catch (e) {
    new Notice('Invalid path')
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
    const dictBasename = basename(path)
    if (definition == null) {
      new Notice(`Word in dictionary ${dictBasename} does not exist`)
      definition = 'Word does not exist'
    }
    result += `<h2>${dictBasename}</h2> <br>` + definition + '<br> <hr>'
  }
  // console.log(result)
  if (isText === true) {
    result = turndownService.turndown(result)
  }
  return result
}
