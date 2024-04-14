import express from 'express'
import type { Server } from 'http'
import cors from 'cors'

import type { wordRequest } from '../types'
import type { MdxDictionarySettings } from '../settings'
import { getDictPaths, lookupSingle } from './lookup'
import { folder2httpRoot } from '../config'
import type { MDXServerPathGroup, MDXServerPath } from '../types'
import { resizeCode } from '../resize/resizeCode'

export default class MDXServer {
  app: express.Application
  port
  server: Server
  pathGroup: MDXServerPathGroup = {}

  constructor(port: number) {
    this.port = port
    this.app = express()
    this.app.use(cors())
  }

  loadSetting(settings: MdxDictionarySettings) {
    for (const group of settings.group) {
      this.pathGroup[group.name] = {
        name: group.name,
        dictPaths: [],
        dictAllPaths: [],
        folderIdx: [],
        folderPaths: [],
      }
      this.pathGroup[group.name].dictPaths = group.dictPaths
      getDictPaths(this.pathGroup[group.name])
      this.static(group.name, this.pathGroup[group.name])
    }
    settings.pathGroup = this.pathGroup
  }

  updatePath() {
    for (const name in this.pathGroup) {
      // clear data
      this.pathGroup[name].dictAllPaths = []
      this.pathGroup[name].folderIdx = []
      this.pathGroup[name].folderPaths = []

      // update data
      getDictPaths(this.pathGroup[name])
    }
  }

  start() {
    this.app.get('/word', (req, res) => {
      const reqJson = req.query as wordRequest
      if ('dictPath' in reqJson && 'word' in reqJson && 'name' in reqJson) {
        const group = this.pathGroup[reqJson.name]
        const folderIdx = group.folderIdx[group.dictAllPaths.indexOf(reqJson.dictPath)]
        const HTML = lookupSingle(reqJson.word, reqJson.dictPath, reqJson.name, folderIdx)
        if (HTML !== null) {
          HTML.body.innerHTML += `<script type="text/javascript">${resizeCode}</script>`
          // HTML.body.innerHTML += `<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js" defer=""></script>`
          console.log(HTML)
          res.send(`<!DOCTYPE html><html>${HTML.documentElement.innerHTML}</html>`)
        } else {
          res.send(`No such word in this dictionary!`)
        }
      } else {
        res.send('Wrong word request')
      }
    })

    this.server = this.app.listen(this.port, '127.0.0.1', () => {
      console.log(`MDX server started at http://localhost:${this.port}`)
    })
  }

  static(name: string, pathGroup: MDXServerPath) {
    for (let i = 0; i < pathGroup.folderPaths.length; i++) {
      this.app.use(`/${folder2httpRoot}/${name}/${i}`, express.static(pathGroup.folderPaths[i]))
    }
  }

  end() {
    this.server.close()
    console.log('MDX server stopped')
  }
}
