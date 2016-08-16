"use strict";

const apidoc = require('apidoc-core');
const slug = require('slug');
const path = require('path');
const fs = require('fs');

const objectValues = (obj) => Object.keys(obj).map(k => obj[k]);

/**
 * apidoc plugin to generates documentation from REST code source.
 */
module.exports = function(kapi) {
    kapi.onSettingsLoaded('apidoc', buildApidocJSON);
    kapi.onFoldersCollecting([
        path.join(__dirname, 'layouts'),
        path.join(__dirname, 'partials')
    ]);
    kapi.onFileProcessing('*apidoc.json', {
        files: (json) => {
            return objectValues(objectValues(json.data).reduce((prev, cur) => {
                const retKeyName = `${cur.group}-${cur.version || 'latest'}`;

                if(!prev[retKeyName])
                    prev[retKeyName] = { title: cur.group, version: cur.version, methods: [] };

                prev[retKeyName].methods.push(cur);

                return prev;
            }, {}));
        },
        filename: (data) => path.join('api', `${slug(`${data.title}-${data.version.replace(/\./g, '_')}`).toLowerCase()}.md`),
        meta: (data) => ({
            title: data.title,
            version: data.version,
            collection: 'apidoc',
            layout: 'layout_apidoc.html',
            data: data.methods
        })
    });
};

function buildApidocJSON(value, destination, done) {
    // Take care of the logger of apidoc
    const logger = Object.assign({}, console);
    logger.debug = logger.verbose = () => {};
    
    apidoc.setLogger(logger);

    // Parse the source code
    const apidocParsed = apidoc.parse({ src: value });

    // And write the file to the destination folder
    fs.writeFileSync(path.join(destination, 'apidoc.json'), JSON.stringify({
        data: JSON.parse(apidocParsed.data),
        project: JSON.parse(apidocParsed.project)
    }, null, 4));

    done();
}