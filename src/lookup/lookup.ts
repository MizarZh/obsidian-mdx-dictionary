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
    return null
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
    return null
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
  saveFormat: string,
  substituteSettings: Array<substituteRule>,
  template: string
) {
  if (saveFormat === 'markdown') {
    const results = lookupRawAll(word, serverPath)
    results.forEach((val) => turndownService.turndown(val))
    const preResult = templateReplaceAll(template, word, results, serverPath)
    return substitute(preResult, substituteSettings)
  } else if (saveFormat === 'text') {
    const results = lookupRawAll(word, serverPath)
    results.forEach((val) => convert(val))
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

function templateReplaceAll(template: string, word: string, results: string[], serverPath: MDXServerPath) {
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
    // @ts-ignore
    // const dict = new Mdict(path)
    // let definition = dict.lookup(word).definition as string
    // if (definition !== null) {
    // definition = definition.replace(
    //   /<link\s+rel=['"]stylesheet['"]\s+type=['"]text\/css['"]\s+href=['"]([^'"]+)['"]>/,
    //   `<link rel="stylesheet" type="text/css" href="file://${dirname(path)}/$1">`
    // )

    // definition = definition.replace(
    //   '<link rel="stylesheet" type="text/css" href="coca.css">',
    //   `<link rel="stylesheet" type="text/css" href="http://localhost:8081/coca.css">`
    // )

    //   definition = definition.replace(
    //     /<link\s+rel=['"]stylesheet['"]\s+type=['"]text\/css['"]\s+href=['"]([^'"]+)['"]>/,
    //     (match, cssPath) => {
    //       const cssContent = readFileSync(join(dirname(path), cssPath), 'utf-8')
    //       return `<style>
    //       @scope {
    //         ${cssContent}
    //       }</style>`
    //     }
    //   )

    //   definition = definition.replace(/<script\s+src=['"]([^'"]+)['"]>/, (match, jsPath) => {
    //     const jsContent = readFileSync(join(dirname(path), jsPath), 'utf-8')
    //     return `<script>${jsContent}</script>`
    //   })
    // }

    // console.log(definition)
    // <link rel="stylesheet" type="text/css" href="coca.css">
    // definition.replace(/<link><\/link>/)
    //   // console.log(definition)
    //   const parser = new DOMParser()
    //   const definition_HTML = parser.parseFromString(definition, 'text/html')
    //   definition_HTML.querySelectorAll(`link`).forEach((val) => {
    //     if (val.type === 'text/css') {
    //       // val.href = `file://`
    //       val.href = `file://${join(dirname(path), basename(val.href))}`
    //       // console.log(join(dirname(path), basename(val.href)))
    //     }
    //   })
    //   definition_HTML.querySelectorAll(`script`).forEach((val) => {
    //     val.src = `file://${join(dirname(path), basename(val.src))}`
    //   })
    //   console.log(definition_HTML)

    const dictBasename = basename(path)

    // if (definition == null) {
    //   notice(`Word in dictionary ${dictBasename} does not exist`, showNotice)
    //   definition = 'Word does not exist'
    // }
    // result += `<h2>${dictBasename}</h2> <br> <div class="word-definition-results">${definition}</div> <br> <hr>`
    result += `<h2>${dictBasename}</h2> <br> <iframe class="word-definition-results" src="localhost:3000/word?word=${word}&name="}></iframe> <br> <hr>`
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
