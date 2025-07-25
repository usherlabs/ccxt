// ---------------------------------------------------------------------------
// Usage:
//
//      npm run vss
// ---------------------------------------------------------------------------

import fs from 'fs'
import log from 'ololog'
import ansi from 'ansicolor'
import { copyFile } from './fsLocal.js'
import { pathToFileURL } from 'url'
import { URL } from 'url'
import { join } from 'path'
import { platform } from 'process'

ansi.nice

let __dirname = new URL('.', import.meta.url).pathname;

// this is necessary because for some reason
// pathname keeps the first '/' for windows paths
// making them invalid
// example: /C:Users/user/Desktop/
if (platform === 'win32') {
    if (__dirname[0] === '/') {
        __dirname = __dirname.substring(1)
    }
}

//-----------------------------------------------------------------------------

function vss (filename, template, version, global = false) {
    const flag = global ? 'g' : ''
    log.bright.cyan ('Single-sourcing version', version, './package.json → ' + filename.yellow)
    const content = fs.readFileSync (filename, 'utf8')
    const regexp  = new RegExp (template.replace (/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // escape string for use in regexp
                                        .replace ('\\{version\\}', '\\d+\\.\\d+\\.\\d+'), flag)
    fs.truncateSync  (filename)
    fs.writeFileSync (filename, content.replace (regexp, template.replace ('{version}', version)))
}

// ----------------------------------------------------------------------------

async function vssEverything () {
    const packageJSON = JSON.parse (fs.readFileSync (join(__dirname, '..', 'package.json')))
    const version = packageJSON['version']

    log.bright ('New version: '.cyan, version)

    vss ('./ts/ccxt.ts',                                 "const version = '{version}'",                            version)
    vss ('./dist/ccxt.browser.js',                       "const version = '{version}'",                            version)
    vss ('./dist/ccxt.browser.min.js',                   "const ps=\"{version}\"",                                 version)
    vss ('./dist/cjs/ccxt.js',                           "const version = '{version}'",                            version)

    vss ('./go/v4/exchange_metadata.go',                 "var Version string = \"{version}\"",                  version)
    // vss ('./python/ccxt/pro/base/exchange.py',           "__version__ = '{version}'",   version)

    vss ('./README.md',       "ccxt@{version}", version, true)
    vss ('./wiki/Install.md', "ccxt@{version}", version, true)



    log.bright.green ('Version single-sourced successfully.')
}

// ============================================================================
// main entry point
let metaUrl = import.meta.url
metaUrl = metaUrl.substring(0, metaUrl.lastIndexOf(".")) // remove extension
const url = pathToFileURL(process.argv[1]);
const href = (url.href.indexOf('.') !== -1) ? url.href.substring(0, url.href.lastIndexOf(".")) : url.href;
if (metaUrl === href) {

    // if called directly like `node module`
    await vssEverything ()

} else {

    // do nothing if required as a module
}

// ============================================================================

export {
    vss,
    vssEverything,
}
