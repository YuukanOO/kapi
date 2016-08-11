"use strict";

const path = require('path');
const fs = require('fs');
const kss = require('kss');

module.exports = function(kapi) {
    kapi.onSettingsLoaded('kss', buildKssJSON);
};

function buildKssJSON(value, destination, done) {
    kss.traverse(value).then(styleguide => {
        fs.writeFileSync(path.join(destination, 'kss.json'), JSON.stringify(styleguide, null, 4));
        done();
    });
}