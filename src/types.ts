export interface substituteRule {
  rule: string
  substitute: string
}

export interface MDXDictGroup {
  name: string
  dictPaths: Array<string>
  fileSavePath: string
  saveFormat: SaveFormat
  saveTemplate: SaveTemplate
  showNotice: boolean
  rules: Array<substituteRule>
  hotkeySearch: string
  hotkeySave: string
}

export type SaveFormat = 'markdown' | 'text' | 'raw' | 'iframe'

export type SaveTemplate = {
  [key in SaveFormat]: string
}

export interface wordRequest {
  dictPath?: string
  word?: string
  name?: string
}

export interface MDXServerPathGroup {
  [key: string]: MDXServerPath
}

export interface MDXServerPath {
  name: string
  dictPaths: string[]
  dictAllPaths: string[]
  folderIdx: number[]
  folderPaths: string[]
}
