export interface substituteRule {
  rule: string
  substitute: string
}

export interface MDXDictGroup {
  dictPaths: Array<string>
  fileSavePath: string
  saveFormat: string
  showNotice: boolean
  rules: Array<substituteRule>
}
