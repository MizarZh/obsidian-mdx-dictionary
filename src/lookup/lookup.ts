import Mdict from 'js-mdict'

import { basename, extname, join } from 'path'

import { Notice } from 'obsidian'

import { readdirSync, statSync } from 'fs'

import { convert } from 'html-to-text'

import { notice } from '../utils'

import TurndownService from 'turndown'

import type { transformRule } from '../types'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export function lookup(
  path: string,
  word: string,
  saveFormat: string,
  showWordNonexistenceNotice: boolean,
  substituteSettings: Array<transformRule>
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
  if (saveFormat === 'markdown') {
    const preResult = turndownService.turndown(result)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'text') {
    const preResult = convert(result)
    return substitute(preResult, substituteSettings)
  }
  return result
}

function substitute(text: string, settings: Array<transformRule>): string {
  let output = text
  for (const setting of settings) {
    console.log(setting)
    const rule = new RegExp(setting.rule, 'g')
    output = output.replaceAll(rule, setting.substitute)
  }
  return output
}

// \*\*[0-9]\\\.\*\*