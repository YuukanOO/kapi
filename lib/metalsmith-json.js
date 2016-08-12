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
        for(var file in files) {
            const fileObj = files[file];

            patterns.forEach(pattern => {
                if(multimatch(file, pattern).length > 0) {
                    const transf = Object.assign({}, defaultOpts, opts[pattern]);
                    const fileContent = fileObj.contents.toString('utf8');
                    const jsonParsed = JSON.parse(fileContent);
                    
                    const transformedData = transf.files(jsonParsed);
                    
                    transformedData.forEach((data) => {
                        
                    });

                    delete files[file];
                }
            });
        }

        // for (var file in files) {
        //     const fileOpts = opts[file];
            
        //     if(fileOpts) {
        //         const fileObj = files[file];

        //         try {
        //             const dataTransformed = fileOpts.data(JSON.parse(fileObj.contents.toString('utf8')));
                    
        //             dataTransformed.forEach((f) => {
        //                 files[`${fileOpts.filename(f)}.md`] = fileOpts.metadata(f);
        //             });

        //             delete files[file];
        //         } catch(e) {
        //             console.error(e);
        //         }
        //     }
        // }

        done();
    };
};