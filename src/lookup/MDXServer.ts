import express from 'express'
import type { Server } from 'http'
import cors from 'cors'

import type { wordRequest } from '../types'
import type { MdxDictionarySettings } from '../settings'
import { lookupWebAll, lookupWebSingle } from './lookup'
import { folder2httpRoot, word2httpRoot } from '../config'
import type { MDXServerPathGroup, MDXServerPath } from '../types'
import { resizeCode } from '../resize/resizeCode'
import { notice, checkPathValid } from '../utils'
import path, { basename, extname, join, dirname } from 'path'
import { readdirSync, statSync, readFileSync } from 'fs'

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
      this.getDictPaths(group.name)
      this.static(group.name, this.pathGroup[group.name])
    }
    settings.pathGroup = this.pathGroup
  }

  updatePath(settings: MdxDictionarySettings) {
    for (const name in this.pathGroup) {
      // clear data
      this.pathGroup[name].dictAllPaths = []
      this.pathGroup[name].folderIdx = []
      this.pathGroup[name].folderPaths = []

      // update data
      this.getDictPaths(name)
    }
    settings.pathGroup = this.pathGroup
  }

  start() {
    this.app.get(`/${word2httpRoot}`, (req, res) => {
      const reqJson = req.query as wordRequest
      if ('dictPath' in reqJson && 'word' in reqJson && 'name' in reqJson) {
        const group = this.pathGroup[reqJson.name]
        const folderIdx = group.folderIdx[group.dictAllPaths.indexOf(reqJson.dictPath)]
        let HTML = lookupWebSingle(reqJson.word, reqJson.dictPath, reqJson.name, folderIdx)
        if (HTML !== null) {
          HTML += `<script type="text/javascript">${resizeCode}</script>`
          // HTML += `<script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js" defer=""></script>`
          // console.log(HTML)
          res.send(`<!DOCTYPE html><html>${HTML}</html>`)
        } else {
          res.send(`No such word in this dictionary!`)
        }
      } else {
        notice('MDX Server query error', true)
        res.send('MDX Server query error')
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

  getDictPaths(name: string) {
    const serverPath = this.pathGroup[name]
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
}
