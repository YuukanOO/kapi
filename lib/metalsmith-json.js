"use strict";

const multimatch = require('multimatch');
const defaultMeta = {
    title: '',
    layout: '',
    data: {},
    contents: ''
};

const defaultOpts = {
    files: (json) => Array.isArray(json) ? json : Object.keys(json),
    filename: (data) => Object.keys(data)[0],
    meta: (data) => defaultMeta
};

module.exports = function (opts) {

    const patterns = Object.keys(opts);

    return function json(files, metalsmith, done){
        const metadata = metalsmith.metadata();

        for(var file in files) {
            const fileObj = files[file];

            patterns.forEach(pattern => {
                if(multimatch(file, pattern).length > 0) {
                    const metas = [];
                    const transf = Object.assign({}, defaultOpts, opts[pattern]);
                    const fileContent = fileObj.contents.toString('utf8');
                    const jsonParsed = JSON.parse(fileContent);
                    
                    const transformedData = transf.files(jsonParsed);
                    
                    transformedData.forEach((data) => {
                        const dataMeta = Object.assign({}, defaultMeta, transf.meta(data));
                        files[transf.filename(data)] = dataMeta;
                        
                        if(dataMeta.collection) {
                            metadata[dataMeta.collection] = metadata[dataMeta.collection] || [];
                            metadata[dataMeta.collection].push(dataMeta);
                        }
                    });
                    
                    delete files[file];
                }
            });
        }

        done();
    };
};