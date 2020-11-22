const glob = require('glob');
const commentParser = require('comment-parser');

// get files from multiple sources
exports.get_files = source=> Promise.all(source.map(src=>{
    return new Promise((resolve,reject)=>{
        glob(src,(err,files)=>{
            if (err) reject(err);
            resolve(files);
        });
    });
}));

// prmisify commentParser load file.
exports.parse_file = file => new Promise((resolve,reject)=>{
    commentParser.file(file, (err,result)=>err ? reject(err) : resolve(result));
})