#!/usr/bin/env node
const {get_files, parse_file, createLinks, extracted_docs_to_html} = require('./lib');
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
    fs.writeFileSync(`${destination}/index.html`,
        `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Socket.io-doc</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/picnic">
                <link href="https://cdn.lineicons.com/2.0/LineIcons.css" rel="stylesheet">
                <link rel="stylesheet" href="./css/style.css">
                <script src="https://cdn.socket.io/socket.io-3.0.3.min.js"></script>
            </head>
            <body>
                <div class="flex two">
                    <div class="full half-900">
                        <span>
                            Logo
                        </span>
                    </div>
                    <div class="full half-900">
                        <div class="three flex">
                            <input id="server" value="" class="two-third" type="text" placeholder="socket entry point" style="margin:0;">
                            <button onClick="toggleConnect()" id="connectBtn" class="sixth shyButton" style="margin:0;padding:0">Connect</button>
                            <button class="sixth pseudo button" style="margin:0;padding:0" onclick="toggleSettingButton()">Query</button>
                            <article class="card settingsForm" id="settingForm">
                                <div id="queryForm"></div>
                                <button class="sixth pseudo button" style="margin:0;padding:0" onclick="addQueryFrom()">
                                    <i class="lni lni-circle-plus"></i>add
                                </button>
                            </article>
                        </div>
                    </div>
                </div>
                <div class="flex three demo">
                    <div class="full sixth-900">
                        <header><h4>Emits</h4></header>
                        <span class="emitsMenu">
                            <ul>${emitLinks}</ul>
                        </span>
                    </div>
                    <div class="full two-third-900">
                        <span>
                            ${extracted_docs_to_html(results.filter(docs=> docs.action === 'listen'))}
                        </span>
                    </div>
                    <div class="full sixth-900"><span>
                        <header><h4>Listens</h4></header>
                        ${extracted_docs_to_html(results.filter(docs=> docs.action === 'emit'))}
                    </span></div>
                </div>

                <footer class="flex full">
                    <p>Powered by: socketio-doc</p>
                </footer>
                
                <div id="consoleContainer" class="normalConsole">
                    <div id="consoleHead">
                        <i
                            class="lni lni-arrow-up-circle"
                            style="display: block; color: darkslategray;"
                            id="toggleCollapseConsole"
                            onClick="document.getElementById('consoleContainer').classList.toggle('fullscreenConsole')"
                        ></i>
                        <small>result window</small>
                        <i 
                            class="lni lni-close"
                            style="background: red; color: white;"
                            onClick="document.getElementById('consoleContainer').style.display = 'none'; document.getElementById('showConsole').style.display='flex';"
                        ></i>
                    </div>
                    <ol reversed id="allEventsList">

                    </ol>
                </div>
                <div id="showConsole" onClick="document.getElementById('consoleContainer').style.display='flex'; this.style.display='none'">
                    <i class="lni lni-32 lni-code-alt"></i>
                </div>
            </body>
        </html>
        <script>
            var socket;
            function toggleSettingButton() {
                let x = document.getElementById("settingForm");
                if (x.style.display === "none") {
                    x.style.display = "block";
                } else {
                    x.style.display = "none";
            }
            }
            function addQueryFrom(){
                let form = document.getElementById('queryForm');
                form.insertAdjacentHTML('beforeend','<div class="queryFormParam"><input  value="" class="fourth" type="text" placeholder="key" style="margin:0;"><input  value="" class="three-fifth" type="text" placeholder="value" style="margin:0;"><button class="sixth pseudo button" style="margin:0;padding:0" onclick="removeQueryFrom(this)">\
                    <i class="lni lni-circle-minus" style="color: red;" </button></div>');
            }
            function removeQueryFrom(elem){
                elem.parentNode.remove()
            }
            function toggleConnect() {
                if (socket && socket.connected) {
                    socket.disconnect();
                    let toggleConnectBtn=document.getElementById("connectBtn");
                    toggleConnectBtn.textContent='Connect' ;
                    return toggleConnectBtn.classList.remove('success');
                }

                let queryParam = {};
                let params = document.querySelectorAll('.queryFormParam')
                for(param of params){
                    queryParam[param.children[0].value] =  param.children[1].value
                }

                socket = io.connect(document.getElementById('server').value, {transports: ['websocket'], ...(queryParam && {query:queryParam})});
                
                socket.on('connect',()=>{
                    let toggleConnectBtn=document.getElementById("connectBtn");
                    toggleConnectBtn.textContent='Disconnect';
                    toggleConnectBtn.classList.add('success');
                });

                socket.on('disconnect',()=>{
                    let toggleConnectBtn=document.getElementById("connectBtn");
                    toggleConnectBtn.textContent='Connect' ;
                    return toggleConnectBtn.classList.remove('success');
                })

                var onevent = socket.onevent;
                socket.onevent = function (packet) {
                    var args = packet.data || [];
                    onevent.call (this, packet);    // original call
                    packet.data = ["*"].concat(args);
                    onevent.call(this, packet);      // additional call to catch-all
                };

                socket.on("*",function(event,data) {
                    let selecteds=[...document.querySelectorAll('.inp:checked')].map(e => e.value);
                    if (!selecteds.includes(event)) return;
                    let li = document.createElement('li');
                    li.innerHTML="\
                        <div style='display:flex;flex-direction:row;align-items: center;'>\
                            <div style='flex:0;text-align: center;'>\
                                <p style='font-size:10px;'>"+new Date().toLocaleString()+"</p>\
                                <h3><span class='label' style='margin:0'>"+event+"</span></h3>\
                            </div>\
                            <div style='flex:1;padding:5px;'>\
                                <code>"+data+"</code>\
                            </div>\
                        </div>\
                    "
                    
                    let list = document.getElementById("allEventsList");
                    list.insertBefore(li, list.firstChild);
                });
            }
        </script>`);
        console.log(chalk.green(`\tBuild compelete :  ${destination}`))
    })
    .catch(e=>console.error(chalk.red(e)));
   });

   socketioDocCli.parse(process.argv);