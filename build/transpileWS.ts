// ---------------------------------------------------------------------------
// Usage: npm run transpileWs
// ---------------------------------------------------------------------------

import fs from 'fs';
import log from 'ololog';
import ccxt from '../js/ccxt.js';
import ansi  from 'ansicolor'
import {
    replaceInFile,
    copyFile,
    overwriteFile,
    createFolder,
    createFolderRecursively,
} from './fsLocal.js';
import Exchange from '../js/src/base/Exchange.js';
import {  Transpiler, parallelizeTranspiling, isMainEntry } from './transpile.js';

const exchanges = JSON.parse (fs.readFileSync("./exchanges.json", "utf8"));
const wsExchangeIds = exchanges.ws;

const { unCamelCase, precisionConstants, safeString, unique } = ccxt;

ansi.nice
// ============================================================================

class CCXTProTranspiler extends Transpiler {

    getBaseClass () {
        return new Exchange ()
    }



    sortExchangeCapabilities (code) {
        return false
    }

    exportTypeScriptClassNames (file, classes) {

        log.bright.cyan ('Exporting WS TypeScript class names →', file.yellow)

        const commonImports = [
            '        export const exchanges: string[]',
            '        class Exchange  extends ExchangePro {}'
        ]

        const replacements = [
            {
                file:file,
                regex: /\n\n\s+export\snamespace\spro\s{\n\s+[\s\S]+}/,
                replacement: "\n\n    export namespace pro {\n" + commonImports.join('\n') + '\n' + Object.keys (classes).map (className => {
                    return '        class ' + className + ' extends Exchange {}'
                }).join ("\n") + "\n    }\n}"
            }
        ]

        replacements.forEach (({ file, regex, replacement }) => {
            replaceInFile (file, regex, replacement)
        })

    }

    // -----------------------------------------------------------------------
    wsTestsDirectories = {
        ts: './ts/src/pro/test/',
    };

    transpileWsTests (){
        this.transpileWsCacheTest();
        this.transpileWsOrderBookTest();
        this.transpileWsExchangeTests();
    }

    transpileWsExchangeTests () {
        const wsCollectedTests: Object[] = [];
        for (const currentFolder of ['Exchange/']) {
            const fileNames = this.readTsFileNames(this.wsTestsDirectories.ts + currentFolder);
            for (const testName of fileNames) {
                const testNameUncameled = this.uncamelcaseName(testName);
                const test = {
                    base: false,
                    name: testName,
                    tsFile: this.wsTestsDirectories.ts + currentFolder + testName + '.ts',
                };
                wsCollectedTests.push(test);
            }
        }

        this.transpileAndSaveExchangeTests (wsCollectedTests);
    }



    transpileWsOrderBookTest() {
        const currentFolder = 'base/';
        const testName = 'test.orderBook';
        const testNameUncameled = this.uncamelcaseName(testName);
        const test = {
            base: true,
            name: testName,
            tsFile: this.wsTestsDirectories.ts + currentFolder + testName + '.ts',
        };
        this.transpileAndSaveExchangeTests ([test]);
    }

    transpileWsCacheTest() {
        const currentFolder = 'base/';
        const testName = 'test.cache';
        const testNameUncameled = this.uncamelcaseName(testName);
        const test = {
            base: true,
            name: testName,
            tsFile: this.wsTestsDirectories.ts + currentFolder + testName + '.ts',
        };
        this.transpileAndSaveExchangeTests ([test]);
    }

    // -----------------------------------------------------------------------

    async transpileEverything (force = false, child = false) {

        // default pattern is '.js'
        // const [ /* node */, /* script */, pattern ] = process.argv.filter (x => !x.startsWith ('--'))
        const exchanges = process.argv.slice (2).filter (x => !x.startsWith ('--'))
            , jsFolder = './js/src/pro/'
            , tsFolder = './ts/src/pro/'
            , options = { jsFolder, exchanges }

         const transpilingSingleExchange = (exchanges.length === 1); // when transpiling single exchange, we can skip some steps because this is only used for testing/debugging
        if (transpilingSingleExchange) {
            force = true; // when transpiling single exchange, we always force
        }
            // createFolderRecursively (python2Folder)
        if (!transpilingSingleExchange) {
            if (this.buildPython) {
                createFolderRecursively (python3Folder)
            }
            if (this.buildPHP) {
                createFolderRecursively (phpAsyncFolder)
            }
        }

        const classes = this.transpileDerivedExchangeFiles (tsFolder, options, '.ts', force, child || exchanges.length)

        if (transpilingSingleExchange) {
            return;
        }

        this.transpileWsTests ()

        if (child) {
            return
        }

        if (classes === null) {
            log.bright.yellow ('0 files transpiled.')
            return;
        }

        //*/

        // this.transpileErrorHierarchy ({ tsFilename })

        log.bright.green ('Transpiled successfully.')
    }

    
    afterTranspileClass (result, contents) {
        // if same class import (like binanceWS extending binanceRest)
        if (result.baseClass === result.className + 'Rest') {
            return result;
        }
        // we need this because exchanges like binanceusWs extends binanceWs but we need to get the binanceus
        // Rest describe() to inherit all the properties
        const matchOfRestImports = contents.matchAll('\nimport (.*?)Rest from \'..(.*?)\';');
        const matches = [...matchOfRestImports];
        if (matches.length) {
            for (const match of matches) {
                if (match[1]) {
                    const exchangeName = match[1];
                    const exchangeNameRest = exchangeName + 'Rest';
                    result.python3 = result.python3.replace ('\nclass ', 'import ccxt.async_support.' + exchangeName + ' as ' + exchangeNameRest + '\n\n\nclass ');
                    // correct `new Xyz()` format
                    result.python3 = result.python3.replace ('new ' + exchangeNameRest, exchangeNameRest);
                    result.phpAsync = result.phpAsync.replace ('new '+ exchangeNameRest, 'new \\ccxt\\async\\' + exchangeName);
                }
            }
        }
        return result;
    }
}

// ============================================================================
// main entry point
if (isMainEntry(import.meta.url)) { // called directly like `node module`
    const transpiler = new CCXTProTranspiler ()
    const test = process.argv.includes ('--test') || process.argv.includes ('--tests');
    const force = process.argv.includes ('--force')
    const multiprocess = process.argv.includes ('--multiprocess') || process.argv.includes ('--multi')
    const child = process.argv.includes ('--child')

    const pythonOnly = process.argv.includes ('--python');
    const phpOnly = process.argv.includes ('--php');
    if (phpOnly) {
        transpiler.buildPython = false // it's easier to handle the language to build this way instead of doing something like (build python only)
    }
    if (pythonOnly) {
        transpiler.buildPHP = false
    }
    if (!child && !multiprocess) {
        log.bright.green ('isForceTranspile', force)
    }
    if (test) {
        transpiler.transpileWsTests ()
    }
    else if (multiprocess) {
        parallelizeTranspiling (exchanges.ws, undefined, force, pythonOnly, phpOnly)
    } else {
        (async () => {
            await transpiler.transpileEverything (force, child)
        })()
    }

} else {

    // do nothing if required as a module
}

// ============================================================================

export default CCXTProTranspiler
