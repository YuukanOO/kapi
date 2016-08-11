"use strict";

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const options = require(path.join(process.cwd(), 'kapi.json'));

const kapi = (function() {
    function Kapi() {
        this._onSettingsLoaded = {};
        this._opts = {};
        this._destinationSrc = '';
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
    };

    /**
     * Launch the kapi build process with the given options.
     * 
     * @param {Object}  opts    Options for the build process
     */
    Kapi.prototype.build = function(opts) {
        this._opts = opts;
        this._destinationSrc = path.join(this._opts.destination, 'src');

        fse.copySync(path.join(__dirname, 'template'), this._opts.destination);

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
                    return;

                optionKey = optionsKeys[optionIdx];
                optionValue = this._opts[optionKey];
                chain = this._onSettingsLoaded[optionKey] || [];
                chainIdx = -1;
                
                return done();
            }

            chain[chainIdx].call(this, optionValue, this._destinationSrc, done);
        };

        done();
    };

    return new Kapi();
})();

module.exports = kapi;

/**
 * Load all plugins in the plugin folder and add them to the plugins object
 * and call the exported function with the kapi context.
 */
const pluginsPath = path.join(__dirname, 'plugins');

fs.readdirSync(pluginsPath).map((ppath) => require(path.join(pluginsPath, ppath)).call(this, kapi));

// And then, launch the build process!
kapi.build(options);

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