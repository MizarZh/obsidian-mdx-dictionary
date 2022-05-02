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

// export const saveFormatSetting = [
//   {
//     value: 'html',
//     display: 'HTML',
//   },
//   {
//     value: 'markdown',
//     display: 'Markdown',
//   },
//   {
//     value: 'text',
//     display: 'Text',
//   },
// ]

export const saveFormatSetting: Record<string, string> = {
  html: 'HTML',
  markdown: 'Markdown',
  text: 'Text',
}
