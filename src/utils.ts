import Mdict from 'js-mdict'

import { basename, extname, join } from 'path'

import { lstatSync, readdirSync } from 'fs'

// import { convert } from 'html-to-text'

import TurndownService from 'turndown'

const turndownService = new TurndownService()

export function lookup(path: string, word: string, isText: boolean): string {
  let result = ''
  const stat = lstatSync(path),
    files: Array<string> = []

  if (stat.isDirectory()) {
    const fileList = readdirSync(path)
    for (const file of fileList) {
      if (extname(file).match(/\.(mdx|mdd)/)) files.push(join(path, file))
    }
  } else {
    if (extname(path).match(/\.(mdx|mdd)/)) files.push(path)
  }
  console.log(files)
  for (const path of files) {
    const dict = new Mdict(path)
    const text = dict.lookup(word).definition
    const dictBasename = basename(path)
    result += `<h2>${dictBasename}</h2> <br>` + text + '<br> <hr>'
    if (isText === true) {
      result = turndownService.turndown(result)
    }
    // console.log(result)
  }
  return result
}
