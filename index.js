const commentParser = require('comment-parser');

const parseFile = file => new Promise((resolve,reject)=>{
    commentParser.file(file, (err,result)=>err ? reject(err) : resolve(result));
})

parseFile('./sample.js').then(c=> {
    let all = Object.values(c).reduce((result,item)=>{
        if (!item.tags.some(i=>i.tag==='socket.io-doc')) return result;
        let category = item.tags.find(i=>i.tag==='tag');
        category=category ? category.name : 'uncategorized';

        let transformed = item.tags.reduce((r,t)=>{
            (t.tag === 'listen' || t.tag ==='emit') && (r={...r,action:t.tag, event: t.name});
            t.tag==='example' && (r={...r, example: t.name.replace(/\n|\r/g, "")+t.description.replace(/\n|\r/g, "")});
            return r;
        },{
            category,
            description:item.description || null
        });
        result.push(transformed);
        return result;
    },[]);

    console.log(all);
}).catch(e=>console.error(e));

