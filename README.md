## obsidian-mdx-dictionary
An embeded mdx dictionary in obsidian.

[js-mdict](https://github.com/terasum/js-mdict) is used to read mdx file.

## Feature
- [x] Search word in obsidian
- [x] Save word to a file with template and substitution
- [x] Separated group settings for different demands.
- [x] Iframe embeds and mdx server. This is for formatting (css) and scripting (js) of MDX file.
- [ ] Batch output, more flexible word searching/saving
- [ ] Search panel
- [ ] More templating keywords
- [ ] Better notice and error handling
- [ ] Media server

## Usage
### Add a new dictionary group
Click "Add new group" button,  this creates a group with random name (you can change it by clicking on the group name). Then fill in the dictionary path, file save path and optional substitue rules. Every group is asscoiated with their own sets of commands.

### Commands
#### Search word by input
Select nothing, then use command "MDX Dictionary: Search Word using Group \<xxx>(group name)" (either by `ctrl + p` or hotkey). A prompt will pop up. Input the word and click "Submit" and the result page will show up in sidebar.

#### Search word by selection
Select a word, then use the same command as `Search word by input` in `Source mode` or `Live Preview` mode.

#### Save word to file by input
Click "Save as file" in the word input prompt using the same command as `Search word by input`.

#### Save word to file by selection
Select a word, then use command "MDX Dictionary: Save Selected Word to File using Group \<xxx>(group name)" (either by `ctrl + p` or hotkey)

### Output format
There are four output formats:
- raw: Raw structure directly from mdx dictionary. Because raw structure is html-like, it looks very ugly in obsidian `live preview` mode. This preserves inline formats, but not for external css link and js script.
- markdown: Convert raw structure into markdown format. This looks somewhat better in obsidian `live preview` mode, but most of the  inline formats will be lost (for example color). Conversion uses [turndown](https://github.com/mixmark-io/turndown).
- text: Convert raw structure into text format. Conversion uses [html-to-text](https://www.npmjs.com/package/html-to-text).
- iframe: Embeded webpage of raw mdx structure. In this way we can access to external css link and js script, but the height cannot be decided before hand because of the nature of iframe element. (except for search view, more on it later)

### Template
For every output format, there is a template for output:
```
<!-- word -->
#{{word}}
<!-- date -->
date: {{date}}

---
<!-- for loop of all the dictionaries -->
{{#for}}
<!-- name of every dictionary -->
## {{basename}}
<!-- path of every dictionary -->
{{path}}
<!-- result from every dictionary -->
{{result}}

---
<!-- end of for loop -->
{{/for}}
```

### Substitution
There is a "Substitute Regexp Settings" for each group. Click "Add a new rule" to add a new substitution rule.

It will replace pattern (in Regexp) with subsitution in the output.

### MDX dictionary local server
In order to access to external css link and js script, a local server is set up for showing html content. It is possible to access it in the browser. This is also useful because it helps to separate the envrionments.

Resizable iframes in search view are done by using [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer). This does not work in the editor.
