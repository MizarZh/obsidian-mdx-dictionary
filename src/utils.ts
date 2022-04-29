import Mdict from 'js-mdict'

import { basename } from 'path'

import { convert } from 'html-to-text'

import TurndownService from 'turndown'

const turndownService = new TurndownService()

export function lookup(path: string, word: string, isText: boolean): string {
  let result = ''
  const dict = new Mdict(path)
  const text = dict.lookup(word).definition
  const dictBasename = basename(path)
  result += `<h1>${dictBasename}</h1>\n <br>` + text + '\n'
  if (isText === true) {
    result = turndownService.turndown(result)
  }
  console.log(result)
  return result
}
