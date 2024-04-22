import Mdict from 'js-mdict'
import { basename, extname, join, dirname } from 'path'
import { convert } from 'html-to-text'
import { notice, checkPathValid } from '../utils'
import TurndownService from 'turndown'
import type { substituteRule, MDXServerPath, SaveFormat } from '../types'
import { httpPath, folder2httpRoot, word2httpRoot } from '../config'
import { saveTemplateDefault } from '../settings'
import { resizeCode } from '../resize/resizeCode'

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
    notice(`No word found in ${basename(path)}`, true)
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
    notice(`No word found in ${basename(path)}`, true)
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

export function lookupWebSeparated(
  word: string,
  serverPath: MDXServerPath,
  template: string,
  className: string
) {
  const results = []
  for (const path of serverPath.dictAllPaths) {
    results.push(
      `<iframe class="${className}" seamless src="${httpPath}/${word2httpRoot}?word=${word}&name=${serverPath.name}&dictPath=${path}"></iframe>`
    )
  }
  const result = templateReplaceAll(template, word, results, serverPath)
  return result
}

export function lookupAll(
  word: string,
  serverPath: MDXServerPath,
  saveFormat: SaveFormat,
  template: string,
  substituteSettings: Array<substituteRule>
) {
  if (template.trim() === '') {
    template = saveTemplateDefault[saveFormat]
  }
  if (saveFormat === 'markdown') {
    let results = lookupRawAll(word, serverPath)
    results = results.map((val) => turndownService.turndown(val))
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'text') {
    let results = lookupRawAll(word, serverPath)
    results = results.map((val) => convert(val))
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'iframe') {
    const preResult = lookupWebSeparated(word, serverPath, template, 'word-definition-embed')
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
