const glob = require('glob')


module.exports.get_files = function(params){
    let files = [];
    for(param of params){
        glob(param, {absolute:true},(err, data)=>{
            files.push(...data)
        })

    }
    return files

}
