"use strict";

const slug = require('slug');
const path = require('path');
const fs = require('fs');
const kss = require('kss');

module.exports = function(kapi) {
    kapi.onSettingsLoaded('kss', buildKssJSON);
    kapi.onFoldersCollecting([
        path.join(__dirname, 'layouts')/*,
        path.join(__dirname, 'partials')*/
    ]);
    kapi.onFileProcessing('*kss.json', {
        files: (json) => json.sections,
        filename: (data) => path.join('styleguide', `${slug(data.header).toLowerCase()}.md`),
        meta: (data) => ({
            title: data.header,
            data,
            layout: 'layout_kss.html'
        })
    });
};

function buildKssJSON(value, destination, done) {
    kss.traverse(value).then(styleguide => {
        fs.writeFileSync(path.join(destination, 'kss.json'), JSON.stringify(styleguide, null, 4));
        done();
    });
}