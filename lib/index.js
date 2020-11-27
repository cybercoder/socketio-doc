const glob = require('glob');
const fs = require('fs');
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

exports.extracted_docs_to_html = docs =>
    docs.reduce((result,doc)=> (
        `${result}<div class="flex" id="${doc.action}_${doc.event}">
            <article class="card">
            <header>
            <h5> category :<span class="label success">${doc.tag}</span></h5>
            </header>
            <footer>
                <div class="flex">
                description : <p>${doc.description}</p> 
                </div>
                <h5> event : <span class="label"> ${doc.event}</span> </h5>
                <h5> action : <span class="label"> ${doc.action}</span> </h5>
                <div class="flex">
                <h5>example: </h5>
                <code class="flex">socket.emit('${doc.event}', ${doc.example}) </code>
                <textarea id="${doc.event}_data">${doc.example}</textarea>
                <div>
                <div>
                <button
                    onClick="socket.emit('${doc.event}', document.getElementById('${doc.event}_data').value);"
                    class='success'>
                        Emit
                </button>
                </div>
            </footer>
            </article>
        </div> \n
        `
    ),'');

exports.createLinks = items=>items.reduce((result,item)=>result+`- [${item.event}](#${item.action}_${item.event})\n`,'');