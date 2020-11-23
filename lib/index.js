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

exports.extracted_docs_to_html = docs => new Promise((resolve, reject)=>{
    const file = fs.createWriteStream("emiter.html");
    Promise.all(docs.map(doc=>{
        file.once('open',(fd)=>{
            file.write(`
<div class="flex two">

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
        <div>
        <div>
        <button class='success'>Emit the message</button>
        </div>


    </footer>
    </article>

</div> \n
            `)
        })
    }))
})