"use strict";

const apidoc = require('apidoc-core');
const fs = require('fs');

/**
 * apidoc plugin to generates documentation from REST code source.
 */
module.exports = function(kapi) {
    kapi.onStart(onStart);
};

function onStart(path, destination, done) {
    // Take care of the logger of apidoc
    const logger = Object.assign({}, console);
    logger.debug = logger.verbose = () => {};
    
    apidoc.setLogger(logger);

    // Parse the source code
    const apidocParsed = apidoc.parse({ src: path });

    // And write the file to the destination folder
    fs.writeFileSync(path.join(destination, 'apidoc.json'), JSON.stringify({
        data: JSON.parse(apidocParsed.data),
        project: JSON.parse(apidocParsed.project)
    }, null, 4));

    done();
}

function processFile(done) {

}