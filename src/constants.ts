import type { SaveFormat } from './types'

export const suggestSaveFile = [
  {
    title: 'Append to the file',
    operation: 'append',
  },
  {
    title: 'Overwrite the file',
    operation: 'overwrite',
  },
  {
    title: 'Do nothing to the file',
    operation: 'ignore',
  },
]

export const saveFormatSetting: Record<SaveFormat, string> = {
  markdown: 'Markdown',
  text: 'Text',
  raw: 'Raw',
  iframe: 'iframe',
}
