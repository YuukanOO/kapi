"use strict";

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const winston = require('winston');

const defaultOpts = {
    pluginsDirectories: [path.join(__dirname, 'plugins')], // Where to look for the plugins
    plugins: ['kapi-apidoc', 'kapi-kss'] // List of plugins to use (ie. The folder where the plugin index.js exists)
};

/**
 * Metalsmith related requirings!
 */
const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const json = require('./metalsmith-json');
const sass = require('metalsmith-sass');
const markdown = require('metalsmith-markdown');

const kapi = (function() {
    function Kapi() {
        this._onSettingsLoaded = {};
        this._onFileProcessing = {};
        this._onFoldersCollecting = [];
        this._opts = {};
        this._destination = '';
    }

    /**
     * Register a callback to be called when kapi settings are loaded.
     * 
     * @param {String}      settingsKey     Settings key for which the callback should be called
     * @param {Function}    callback        Callback to call (keyValue: string, destination: string, done: Function) => void
     */
    Kapi.prototype.onSettingsLoaded = function(settingsKey, callback) {
        if(!this._onSettingsLoaded[settingsKey])
            this._onSettingsLoaded[settingsKey] = [];

        this._onSettingsLoaded[settingsKey].push(callback);

        winston.info(`Added settings hook for ${settingsKey}`);
    };

    /**
     * Add folders to be collected and outputted to the destination folder.
     * 
     * @param {Array}   folders     Array of folders to copy to the destination
     */
    Kapi.prototype.onFoldersCollecting = function(folders) {
        this._onFoldersCollecting = this._onFoldersCollecting.concat(folders);

        winston.info(`Added folder(s) to copy: ${folders.join(',')}`);
    };

    /**
     * Register a callback to be called when files are processed.
     * 
     * @param {String}    pattern                 File pattern to match
     * @param {Object}    fileProcessingStruct    Structure to parse the content of the file
     */
    Kapi.prototype.onFileProcessing = function(pattern, fileProcessingStruct) {
        this._onFileProcessing[pattern] = fileProcessingStruct;

        winston.info(`Added file processing hook for ${pattern}`);
    };

    /**
     * Launch the kapi fullchain process with the given options.
     * 
     * @param {Object}  opts    Options for the build process
     */
    Kapi.prototype.run = function(opts) {
        winston.info('Kapi is launching!');

        this._opts = Object.assign(defaultOpts, opts);
        // Add the kapi module plugins directory if pluginsDirectories was specified by the user
        if(opts.pluginsDirectories && opts.pluginsDirectories.length > 0)
            this._opts.pluginsDirectories = this._opts.pluginsDirectories.concat(defaultOpts.pluginsDirectories);
        // This is the path used by metalsmith so everything should go inside it
        this._destination = path.join(this._opts.destination, 'src');

        // Start by loading and registering plugins
        this.registerPlugins();

        // And now build the website
        this.build();
    };

    /**
     * Register all plugins based on the env options.
     */
    Kapi.prototype.registerPlugins = function() {
        winston.info(`Loading ${this._opts.plugins.length} plugin(s): ${this._opts.plugins.join(',')} ...`);

        this._opts.plugins.forEach((pluginName) => {
            this._opts.pluginsDirectories.forEach(pluginDir => {
                const fullPath = path.join(pluginDir, pluginName);
                const stat = fs.statSync(fullPath);

                if(stat.isDirectory()) {
                    require(path.join(fullPath, 'index.js')).call(this, this);
                }
            });
        });
    };

    /**
     * Launch the kapi build.
     */
    Kapi.prototype.build = function() {

        winston.info(`Copying template files to ${path.resolve(this._opts.destination)} ...`);
        fse.copySync(path.join(__dirname, 'template'), this._opts.destination);

        winston.info('Collecting folders in plugins...');
        this._onFoldersCollecting.map(f => fse.copySync(f, path.join(this._opts.destination, path.basename(f))));

        const optionsKeys = Object.keys(this._opts);
        let chain = [];
        let optionKey = null;
        let optionValue = null;
        let optionIdx = -1;
        let chainIdx = -1;

        // This is the async guard which will process the chain asynchronously
        const done = () => {
            ++chainIdx;

            if(chainIdx >= chain.length) {
                ++optionIdx;

                if(optionIdx >= optionsKeys.length)
                    return this.buildWebsite();

                optionKey = optionsKeys[optionIdx];
                optionValue = this._opts[optionKey];
                chain = this._onSettingsLoaded[optionKey] || [];
                chainIdx = -1;
                
                winston.info(`Processing setting key ${optionKey} with ${chain.length} hook(s)`);

                return done();
            }
            
            chain[chainIdx].call(this, optionValue, this._destination, done);
        };

        done();
    };

    /**
     * Launch the building of the static website!
     */
    Kapi.prototype.buildWebsite = function() {
        winston.info('Building static website...');

        Metalsmith(this._opts.destination)
            .clean(true)
            .use(sass({
                outputDir: 'css/',
                outputStyle: 'expanded'
            }))
            .use(json(this._onFileProcessing))
            .use(markdown())
            .use(layouts({ 
                engine: 'handlebars',
                partials: 'partials'
            }))
            .build(err => {
                if(err)
                    throw err;
                
                winston.info('Building finished!');
            });
    };

    return new Kapi();
})();

module.exports = kapi;

// And then, launch the build process!
kapi.run(require(path.join(process.cwd(), 'kapi.json')));

// const apidoc = require('apidoc-core');
// const kss = require('kss');
// const path = require('path');
// const fs = require('fs');
// const fse = require('fs-extra');
// const slug = require('slug');
// const Metalsmith = require('metalsmith');
// const layouts = require('metalsmith-layouts');
// const collections = require('metalsmith-collections');
// const json = require('./metalsmith-json');
// const sass = require('metalsmith-sass');
// const markdown = require('metalsmith-markdown');

// const kapiOpts = require(path.join(process.cwd(), 'kapi.json'));
// const generatedJsonDirectory = path.join(kapiOpts.destination, 'src');

// const APIDOC_FILENAME = 'apidoc.json';
// const KSS_FILENAME = 'kss.json';

// Object.values = (obj) => Object.keys(obj).map(k => obj[k]);

// // Starts by copying the kapi metalsmith templates to the target dir
// fse.copySync(path.join(__dirname, 'template'), kapiOpts.destination);

// function build() {
//     // And now, generates the metalsmith static site
//     Metalsmith(kapiOpts.destination)
//         .clean(true)
//         .use(sass({
//             outputDir: 'css/',
//             outputStyle: 'expanded'
//         }))
//         .use(json({
//             [APIDOC_FILENAME]: {
//                 data: (json) => Object.values(Object.values(json.data).reduce((prev, cur) => {
//                     const group = cur.group;

//                     if(!prev[group]) {
//                         prev[group] = {
//                             title: group,
//                             methods: [cur]
//                         };
//                     }
//                     else {
//                         prev[group].methods.push(cur);
//                     }

//                     return prev;
//                 }, {})),
//                 filename: (data) => slug(data.title).toLowerCase(),
//                 metadata: (data) => ({
//                     title:  data.title,
//                     collection: 'apidoc',
//                     layout: 'layout_apidoc.html',
//                     data: data.methods,
//                     contents: ''
//                 })
//             },
//             [KSS_FILENAME]: {
//                 data: (json) => json.sections,
//                 filename: (data) => slug(data.header).toLowerCase(),
//                 metadata: (data) => ({
//                     title: data.header, 
//                     collection: 'kss',
//                     layout: 'layout_kss.html',
//                     data,
//                     contents: ''
//                 })
//             }
//         }))
//         .use(collections({
//             apidoc: {},
//             kss: {}
//         }))
//         .use(markdown())
//         .use(layouts({ 
//             engine: 'handlebars',
//             partials: 'partials'
//         }))
//         .build(err => {
//             if (err)
//                 throw err;
            
//             console.log('Build finished!');
//         });
// }

// // Do that for apidoc
// console.verbose = console.debug = () => {};

// // Generates APIDOC json file ready to be parsed
// function buildApidoc(done) {
//     if(kapiOpts.apiSource) {
//         apidoc.setLogger(console);

//         const apidocParsed = apidoc.parse({ src: kapiOpts.apiSource });
//         fs.writeFileSync(path.join(generatedJsonDirectory, APIDOC_FILENAME), JSON.stringify({
//             data: JSON.parse(apidocParsed.data),
//             project: JSON.parse(apidocParsed.project)
//         }, null, 4));
//     }

//     done();
// }

// // Generates a KSS json file
// function buildKss(done) {
//     if(kapiOpts.styleSource) {
//         kss.traverse(kapiOpts.styleSource)
//             .then(styleguide => {
//                 fs.writeFileSync(path.join(generatedJsonDirectory, KSS_FILENAME), JSON.stringify(styleguide, null, 4))
//                 done();
//             });
//     }
//     else
//         done();
// }

// buildApidoc(() => buildKss(build));