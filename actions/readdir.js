const glob = require('glob')


module.exports.get_files = function(params){
    if(Array.isArray(params)){
        let files = [];
        for(param of params){
            glob(param, { absolute: true },(err, data)=>{
                if(err) throw err
                files.push(...data)
            })
    
        }
        return files

    } else {
        throw new Error(`get_files() only accepts [object Array],  you passed: ${Object.prototype.toString.call(params)}` )
    }

}
