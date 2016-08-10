"use strict";

const apidoc = require('apidoc-core');
const kss = require('kss');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const slug = require('slug');
const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const collections = require('metalsmith-collections');
const json = require('./metalsmith-json');
const sass = require('metalsmith-sass');
const markdown = require('metalsmith-markdown');

const kapiOpts = require(path.join(process.cwd(), 'kapi.json'));
const generatedJsonDirectory = path.join(kapiOpts.destination, 'src');

const APIDOC_FILENAME = 'apidoc.json';
const KSS_FILENAME = 'kss.json';

Object.values = (obj) => Object.keys(obj).map(k => obj[k]);

// Starts by copying the kapi metalsmith templates to the target dir
fse.copySync(path.join(__dirname, 'template'), kapiOpts.destination);

function build() {
    // And now, generates the metalsmith static site
    Metalsmith(kapiOpts.destination)
        .clean(true)
        .use(sass({
            outputDir: 'css/',
            outputStyle: 'expanded'
        }))
        .use(json({
            [APIDOC_FILENAME]: {
                data: (json) => Object.values(Object.values(json.data).reduce((prev, cur) => {
                    const group = cur.group;

                    if(!prev[group]) {
                        prev[group] = {
                            title: group,
                            methods: [cur]
                        };
                    }
                    else {
                        prev[group].methods.push(cur);
                    }

                    return prev;
                }, {})),
                filename: (data) => slug(data.title).toLowerCase(),
                metadata: (data) => ({
                    title:  data.title,
                    collection: 'apidoc',
                    layout: 'layout_apidoc.html',
                    data: data.methods,
                    contents: ''
                })
            },
            [KSS_FILENAME]: {
                data: (json) => json.sections,
                filename: (data) => slug(data.header).toLowerCase(),
                metadata: (data) => ({
                    title: data.header, 
                    collection: 'kss',
                    layout: 'layout_kss.html',
                    data,
                    contents: ''
                })
            }
        }))
        .use(collections({
            apidoc: {},
            kss: {}
        }))
        .use(markdown())
        .use(layouts({ 
            engine: 'handlebars',
            partials: 'partials'
        }))
        .build(err => {
            if (err)
                throw err;
            
            console.log('Build finished!');
        });
}

// Do that for apidoc
console.verbose = console.debug = () => {};

// Generates APIDOC json file ready to be parsed
function buildApidoc(done) {
    if(kapiOpts.apiSource) {
        apidoc.setLogger(console);

        const apidocParsed = apidoc.parse({ src: kapiOpts.apiSource });
        fs.writeFileSync(path.join(generatedJsonDirectory, APIDOC_FILENAME), JSON.stringify({
            data: JSON.parse(apidocParsed.data),
            project: JSON.parse(apidocParsed.project)
        }, null, 4));
    }

    done();
}

// Generates a KSS json file
function buildKss(done) {
    if(kapiOpts.styleSource) {
        kss.traverse(kapiOpts.styleSource)
            .then(styleguide => {
                fs.writeFileSync(path.join(generatedJsonDirectory, KSS_FILENAME), JSON.stringify(styleguide, null, 4))
                done();
            });
    }
    else
        done();
}

buildApidoc(() => buildKss(build));