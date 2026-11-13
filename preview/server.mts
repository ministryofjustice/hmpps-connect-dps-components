import fs from 'node:fs/promises'
import http from 'node:http'
import nunjucks from 'nunjucks'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import * as sass from 'sass'

const user = {}

const { css } = sass.compile('preview/client.scss', {
  loadPaths: ['.', 'node_modules'],
})

const js = (
  await (
    await rollup({
      input: 'preview/client.js',
      plugins: [nodeResolve({ preferBuiltins: true })],
      output: { format: 'esm' },
    })
  ).generate({})
).output[0].code

const njkEnv = nunjucks.configure(['preview', 'node_modules/govuk-frontend/dist/', 'dist/assets/'])

const server = http.createServer(async (req, res) => {
  const [path, qs = ''] = (req.url || '').split('?')
  const params = new URLSearchParams(qs)

  process.stderr.write(`${req.method} ${path}\n`)

  if (path === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    const html = njkEnv.render('client.njk', {
      pageTitle: 'Connect DPS components',
      environmentName: 'DEV',
      user,
      isPrisonUser: true,
      initialisedName: '',
      authUrl: '',
      dpsUrl: '',
      supportUrl: '',
    })
    res.end(html)
  } else if (path === '/client.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
    res.end(css)
  } else if (path === '/client.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' })
    res.end(js)
  } else if (path.startsWith('/assets/')) {
    try {
      const data = await fs.readFile(`node_modules/govuk-frontend/dist/govuk/assets/${path.slice('/assets/'.length)}`)
      res.writeHead(200)
      res.end(data)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('Not Found')
    }
  } else {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('Not Found')
  }
})

const port = process.env.PORT || 3000
process.stderr.write(`Go to http://localhost:${port}/\n`)
server.listen(port)
