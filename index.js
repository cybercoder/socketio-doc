const {get_files, parse_file, createLinks, extracted_docs_to_html}=require('./lib');
const {source} = require('./socket.io-doc.conf.json');
const {Converter} = require('showdown');
const {writeFileSync, fstat} = require('fs');

get_files(source)
.then(async files=>{
    let results = await Promise.all(files.flat().map(async file=> {
        let c = await parse_file(file);
        return Object.values(c).reduce((result,item)=>{
            if (!item.tags.some(i=>i.tag==='socket.io-doc')) return result;
            let tag = item.tags.find(i=>i.tag==='tag');
            tag=tag ? tag.name : 'uncategorized';
        
            let transformed = item.tags.reduce((r,t)=>{
                (t.tag === 'listen' || t.tag ==='emit') && (r={...r,action:t.tag, event: t.name});
                t.tag==='example' && (r={...r, example: t.name.replace(/\n|\r/g, "")+t.description.replace(/\n|\r/g, "")});
                return r;
            },{
                tag,
                description:item.description || null
            });
            result.push(transformed);
            return result;
        },[]);
    }));
    results=results.flat();
    let emitLinks = createLinks(results.filter(r=>r.action==='listen'));
    let converter = new Converter();
    console.log(extracted_docs_to_html(results));
    writeFileSync('./templates/default/index.html',
    `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Socket.io-doc</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/picnic">
            <link rel="stylesheet" href="./css/style.css">
        </head>
        <body>
            <header class="flex one center">
                <span>Head</span>
            </header>
            <div class="flex three demo">
                <div class="full sixth-900">
                    <span>
                        ${converter.makeHtml(emitLinks)}
                    </span>
                </div>
                <div class="full two-third-900">
                    <span>
                        ${extracted_docs_to_html(results)}
                    </span>
                </div>
                <div class="full sixth-900"><span>3</span></div>
            </div>
            <footer class="flex full">
                
            </footer>
        </body>
    </html>`
    )

    
})
.catch(e=>console.error(e));


