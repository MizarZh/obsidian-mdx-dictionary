import Mdict from 'js-mdict'

import { basename } from 'path'

export function lookup(path: string, word: string): string {
  let result = ''
  const dict = new Mdict(path)
  const text = dict.lookup(word).definition
  const dictBasename = basename(path)
  result += `<h1>${dictBasename}</h1>\n <br>` + text + '\n'
  return result
}

