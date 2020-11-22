
const {get_files, parse_file}=require('./lib');
const {source} = require('./socket.io-doc.conf.json');

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
    console.log(results.flat());
})
.catch(e=>console.error(e));


