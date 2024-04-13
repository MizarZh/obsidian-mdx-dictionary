import Mdict from 'js-mdict'

import { basename, extname, join } from 'path'

import { Notice } from 'obsidian'

import { readdirSync, statSync } from 'fs'

import { convert } from 'html-to-text'

import { notice, checkPathValid } from '../utils'

import TurndownService from 'turndown'

import type { substituteRule } from '../types'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export function lookup(
  paths: Array<string>,
  word: string,
  saveFormat: string,
  showNotice: boolean,
  substituteSettings: Array<substituteRule>
): string {
  let result = `<h1>${word}</h1><br><hr><br>`

  const dictAllPaths: Array<string> = getAllDict(paths)
  if (dictAllPaths.length === 0) return 'No dictionary exists'

  // real lookup process via js-mdict
  for (const path of dictAllPaths) {
    const dict = new Mdict(path)
    let definition = dict.lookup(word).definition
    // console.log(definition)
    // const parser = new DOMParser()
    // const definition_HTML = parser.parseFromString(definition, 'text/html')
    // console.log(definition_HTML.head)

    const dictBasename = basename(path)

    if (definition == null) {
      notice(`Word in dictionary ${dictBasename} does not exist`, showNotice)
      definition = 'Word does not exist'
    }
    result += `<h2>${dictBasename}</h2> <br> <div class="test">${definition}</div> <br> <hr>`
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

function getAllDict(paths: Array<string>): Array<string> {
  const dictAllPaths: Array<string> = []
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]

    if (checkPathValid(path)) {
      const stat = statSync(path)
      if (stat.isDirectory()) {
        const fileList = readdirSync(path)
        for (const file of fileList) {
          if (extname(file).match(/\.(mdx|mdd)/)) dictAllPaths.push(join(path, file))
        }
        if (dictAllPaths.length === 0) {
          new Notice('No mdx/mdd files in the chosen directory')
          return []
        }
        // if path points to a file
      } else {
        if (extname(path).match(/\.(mdx|mdd)/)) dictAllPaths.push(path)
        else {
          new Notice('Specified file is not a mdx/mdd file')
          return []
        }
      }
    } else {
      new Notice(`Invalid dictionary path on dict / folder path ${i + 1}`)
      return []
    }
  }
  return dictAllPaths
}

function substitute(text: string, settings: Array<substituteRule>): string {
  let output = text
  for (const setting of settings) {
    const rule = new RegExp(setting.rule, 'g')
    output = output.replaceAll(rule, setting.substitute.replaceAll('\\n', '\n')) // newline substitute
  }
  return output
}

// function concat(word: string, names: Array<string>, texts: Array<string>): string {
//   let result = `<h1>${word}</h1><hr><br>`
//   for (let i = 0; i < names.length; i++) {
//     result += `<h2>${names[i]}</h2> <br>` + texts[i] + '<br> <hr>'
//   }
//   return result
// }

// \*\*[0-9]\\\.\*\*
// \*\*(M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))\.\*\*
