import Mdict from 'js-mdict'
import { basename, extname, join, dirname } from 'path'
import { Notice } from 'obsidian'
import { readdirSync, statSync, readFileSync } from 'fs'
import { convert } from 'html-to-text'
import { notice, checkPathValid } from '../utils'
import TurndownService from 'turndown'
import type { substituteRule, MDXServerPath } from '../types'
import { httpPath, folder2httpRoot, word2httpRoot } from '../config'
import { resizeCode } from '../resize/resizeCode'
import type { SaveFormat } from '../types'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export function lookupWebSingle(word: string, path: string, name: string, folderIdx: number) {
  // @ts-ignore
  const dict = new Mdict(path)
  const definition = dict.lookup(word).definition as string
  if (definition !== null) {
    const parser = new DOMParser()
    const definition_HTML = parser.parseFromString(definition, 'text/html')

    definition_HTML.querySelectorAll(`link`).forEach((val) => {
      if (val.type === 'text/css' && val.rel === 'stylesheet') {
        val.href = `${httpPath}/${folder2httpRoot}/${name}/${folderIdx}/${basename(val.href)}`
      }
    })
    definition_HTML.querySelectorAll(`script`).forEach((val) => {
      val.src = `${httpPath}/${folder2httpRoot}/${name}/${folderIdx}/${basename(val.src)}`
    })
    return definition_HTML.documentElement.innerHTML
  } else {
    return '<p>No such word!</p>'
  }
}

export function lookupWebAll(word: string, serverPath: MDXServerPath) {
  const dictAllPaths = serverPath.dictAllPaths,
    folderIdx = serverPath.folderIdx,
    name = serverPath.name,
    HTMLs = []
  for (let i = 0; i < dictAllPaths.length; i++) {
    HTMLs.push(lookupWebSingle(word, dictAllPaths[i], name, folderIdx[i]))
  }
  return HTMLs
}

export function lookupRawSingle(word: string, path: string) {
  // @ts-ignore
  const dict = new Mdict(path)
  const definition = dict.lookup(word).definition as string
  if (definition !== null) {
    return definition
  } else {
    return 'No such word!'
  }
}

export function lookupRawAll(word: string, serverPath: MDXServerPath) {
  const dictAllPaths = serverPath.dictAllPaths,
    texts = []
  for (let i = 0; i < dictAllPaths.length; i++) {
    texts.push(lookupRawSingle(word, dictAllPaths[i]))
  }
  return texts
}

// {{word}} - word
// {{date}}
export function lookupAll(
  word: string,
  serverPath: MDXServerPath,
  saveFormat: SaveFormat,
  template: string,
  substituteSettings: Array<substituteRule>
) {
  if (saveFormat === 'markdown') {
    let results = lookupRawAll(word, serverPath)
    results = results.map((val) => turndownService.turndown(val))
    console.log(results.map((val) => turndownService.turndown(val)))
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'text') {
    let results = lookupRawAll(word, serverPath)
    results = results.map((val) => convert(val))
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'iframe') {
    const results = lookupWebAll(word, serverPath)
    let preResult = templateReplaceAll(template, word, results, serverPath)
    preResult += `<script type="text/javascript">${resizeCode}</script>`
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'raw') {
    const results = lookupRawAll(word, serverPath)
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  }
  return ''
}

function templateReplaceAll(
  template: string,
  word: string,
  results: string[],
  serverPath: MDXServerPath
) {
  template = template
    .replaceAll('{{word}}', word)
    .replaceAll('{{date}}', () => new Date().toLocaleDateString())

  // Substitution of {{#for ...}}
  template = template.replaceAll(/{{#for}}([\s\S]*?){{\/for}}/g, (match, content) => {
    let forResult = ''
    for (let i = 0; i < results.length; i++) {
      let replacedContent = content
      replacedContent = replacedContent
        .replaceAll('{{result}}', results[i])
        .replaceAll('{{path}}', serverPath.dictAllPaths[i])
        .replaceAll('{{basename}}', basename(serverPath.dictAllPaths[i]))
      forResult += replacedContent
    }
    return forResult
  })
  return template
}

export function template_view(word: string, name: string, paths: string[]) {
  let result = `<script type="text/javascript">${resizeCode}</script> </script><h1>${word}</h1><br><hr><br>`

  // let result = `<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js"></script>
  // <h1>${word}</h1><br><hr><br>`
  for (const path of paths) {
    result += `<h2>${basename(
      path
    )}</h2> <br> <iframe class="word-definition-results" seamless src="${httpPath}/${word2httpRoot}?word=${word}&name=${name}&dictPath=${path}"}></iframe> <br> <hr>`
  }
  return result
}

function substitute(text: string, settings: Array<substituteRule>): string {
  let output = text
  for (const setting of settings) {
    const rule = new RegExp(setting.rule, 'g')
    output = output.replaceAll(rule, setting.substitute.replaceAll('\\n', '\n')) // newline substitute
  }
  return output
}

// \*\*[0-9]\\\.\*\*
// \*\*(M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))\.\*\*
