#!/usr/bin/env node
const {get_files, parse_file, createLinks, generate_html_template} = require('./lib');
const fs = require('fs')
const socketioDocCli =  require("commander");
const chalk =  require("chalk");

socketioDocCli.option('-c, --config <string>', 'Specify config path.').action( cmd=> {
    let {config} = cmd;
    console.log(chalk.white("\n\tconfig file: "), chalk.gray(config || 'config file not specified, using default.','\n'));

    // check config file flag or default config file existance.
    if (!config && !fs.existsSync('./socket.io-doc.conf.json')) {
        return console.log(chalk.red('config file not found.\n'));
    }

    if (config && !fs.existsSync(config)) {
        return console.log(chalk.red('specified config file, not found.\n'));
    }

    let { source, destination } = config ? require(`${config}`) : require('./socket.io-doc.conf.json');

    if (!source) {
        return console.log(chalk.red('source not determined.\n'));
    }

    if (!destination) {
        return console.log(chalk.red('destination not determined.\n'));
    }

    console.log(chalk.green("Start creating documents...\n"));

    return get_files(source)
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

    !fs.existsSync(`${destination}`) && fs.mkdirSync(`${destination}`);
    !fs.existsSync(`${destination}/css`) && fs.mkdirSync(`${destination}/css`);

    fs.createReadStream('./templates/default/css/style.css').pipe(fs.createWriteStream(`${destination}/css/style.css`));
    fs.writeFileSync(`${destination}/index.html`, generate_html_template(emitLinks,results));
    console.log(chalk.green(`\tBuild compelete :  ${destination}`))
    })
    .catch(e=>console.error(chalk.red(e)));
   });

   socketioDocCli.parse(process.argv);