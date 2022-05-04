export interface substituteRule {
  rule: string
  substitute: string
}

export interface MDXDictGroup {
  name: string
  dictPaths: Array<string>
  fileSavePath: string
  saveFormat: string
  showNotice: boolean
  rules: Array<substituteRule>
  hotkeySearch: string
  hotkeySave: string
}
