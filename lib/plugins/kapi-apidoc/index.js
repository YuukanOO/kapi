"use strict";

const apidoc = require('apidoc-core');
const path = require('path');
const fs = require('fs');

/**
 * apidoc plugin to generates documentation from REST code source.
 */
module.exports = function(kapi) {
    kapi.onSettingsLoaded('apidoc', buildApidocJSON);
    kapi.onFoldersCollecting([
        path.join(__dirname, 'layouts')/*,
        path.join(__dirname, 'partials')*/
    ]);
    kapi.onFileProcessing('*apidoc.json', {
        // files: () => {},
        // filename: () => {},
        // meta: () => {}
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