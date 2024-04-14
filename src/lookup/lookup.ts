import Mdict from 'js-mdict'
import { basename, extname, join, dirname } from 'path'
import { Notice } from 'obsidian'
import { readdirSync, statSync, readFileSync } from 'fs'
import { convert } from 'html-to-text'
import { notice, checkPathValid } from '../utils'
import TurndownService from 'turndown'
import type { substituteRule } from '../types'
import { httpPath, folder2httpRoot } from '../config'
import type { MDXServerPath } from '../types'
import { resizeCode } from '../resize/resizeCode'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

export function getDictPaths(serverPath: MDXServerPath) {
  const paths = serverPath.dictPaths
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    if (checkPathValid(path)) {
      const stat = statSync(path)
      if (stat.isDirectory()) {
        serverPath.folderPaths.push(path)
        const fileList = readdirSync(path)
        for (const file of fileList) {
          if (extname(file).match(/\.(mdx|mdd)/)) {
            serverPath.dictAllPaths.push(join(path, file))
            serverPath.folderIdx.push(i)
          }
        }
      } else {
        if (extname(path).match(/\.(mdx|mdd)/)) {
          serverPath.dictAllPaths.push(path)
          serverPath.folderPaths.push(dirname(path))
          serverPath.folderIdx.push(i)
        }
      }
    }
  }
}

export function lookupSingle(word: string, path: string, name: string, folderIdx: number) {
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
    return definition_HTML
  } else {
    return null
  }
}

export function lookupWeb(word: string, serverPath: MDXServerPath) {
  // let result = `<h1>${word}</h1><br><hr><br>`
  const dictAllPaths = serverPath.dictAllPaths,
    folderIdx = serverPath.folderIdx,
    name = serverPath.name,
    HTMLs = []
  for (let i = 0; i < dictAllPaths.length; i++) {
    const path = dictAllPaths[i]

    // lookup process
    // @ts-ignore
    const dict = new Mdict(path)
    const definition = dict.lookup(word).definition as string
    const parser = new DOMParser()
    const definition_HTML = parser.parseFromString(definition, 'text/html')

    // replace link
    definition_HTML.querySelectorAll(`link`).forEach((val) => {
      if (val.type === 'text/css' && val.rel === 'stylesheet') {
        val.href = `${httpPath}/${folder2httpRoot}/${name}/${folderIdx[i]}/${basename(val.href)}`
      }
    })
    definition_HTML.querySelectorAll(`script`).forEach((val) => {
      val.src = `${httpPath}/${folder2httpRoot}/${name}/${folderIdx[i]}/${basename(val.src)}`
    })

    HTMLs.push(definition_HTML)
  }
  return HTMLs
}

export function template_view(word: string, name: string, paths: string[]) {
  let result = `<script type="text/javascript">${resizeCode}</script> </script><h1>${word}</h1><br><hr><br>`

  // let result = `<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js"></script>
  // <h1>${word}</h1><br><hr><br>`
  for (const path of paths) {
    result += `<h2>${basename(
      path
    )}</h2> <br> <iframe class="word-definition-results" seamless src="http://localhost:3000/word?word=${word}&name=${name}&dictPath=${path}"}></iframe> <br> <hr>`
  }
  // document.querySelectorAll('.word-definition-results').forEach((val) => {
  //   const iframe = val as HTMLIFrameElement
  //   iframe.addEventListener('resize', () => {
  //     console.log(iframe)
  //     iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px'
  //   })
  // })
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
