"use strict";

module.exports = function (opts) {
    return function json(files, metalsmith, done){
        for (var file in files) {
            const fileOpts = opts[file];
            
            if(fileOpts) {
                const fileObj = files[file];

                try {
                    const dataTransformed = fileOpts.data(JSON.parse(fileObj.contents.toString('utf8')));
                    
                    dataTransformed.forEach((f) => {
                        files[`${fileOpts.filename(f)}.md`] = fileOpts.metadata(f);
                    });

                    delete files[file];
                } catch(e) {
                    console.error(e);
                }
            }
        }

        done();
    };
}