import express from 'express'
import type { Server } from 'http'
import type { wordRequest } from '../types'
import type { MdxDictionarySettings } from '../settings'
import { getDictPaths, lookupWeb, lookupSingle } from './lookup'
import { folder2httpRoot } from '../config'
import type { MDXServerPathGroup, MDXServerPath } from '../types'

export default class MDXServer {
  app: express.Application
  port
  server: Server
  pathGroup: MDXServerPathGroup = {}

  constructor(port: number) {
    this.port = port
    this.app = express()
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
    console.log(this.pathGroup)
  }

  start() {
    this.app.get('/word', (req, res) => {
      const reqJson = req.query as wordRequest
      console.log(req.query)
      if ('dictPath' in reqJson && 'word' in reqJson && 'name' in reqJson) {
        const group = this.pathGroup[reqJson.name]
        const folderIdx = group.folderIdx[group.dictAllPaths.indexOf(reqJson.dictPath)]
        const HTML = lookupSingle(reqJson.word, reqJson.dictPath, reqJson.name, folderIdx)
        console.log(HTML.documentElement.innerHTML)
        res.send(`<html>${HTML.documentElement.innerHTML}</html>`)
      } else {
        res.send('No such file')
      }
    })

    this.server = this.app.listen(this.port, '127.0.0.1', () => {
      console.log(`MDX server started at http://localhost:${this.port}`)
    })
  }

  static(name: string, pathGroup: MDXServerPath) {
    for (let i = 0; i < pathGroup.folderPaths.length; i++) {
      console.log(`/${folder2httpRoot}/${name}/${i}`)
      this.app.use(`/${folder2httpRoot}/${name}/${i}`, express.static(pathGroup.folderPaths[i]))
    }
  }

  end() {
    this.server.close()
    console.log('MDX server stopped')
  }
}
