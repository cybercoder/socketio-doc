const {get_files, parse_file, createLinks, extracted_docs_to_html}=require('./lib');
const {source} = require('./socket.io-doc.conf.json');
const {Converter} = require('showdown');
const {writeFileSync, fstat} = require('fs');
const { docsSchema } = require('./validations/docs_validation');
const Validator = require("fastest-validator");
const v = new Validator();
const check = v.compile(docsSchema);

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
    results=results.flat()

    let emitLinks = createLinks(results.filter(r=>r.action==='listen'));
    let converter = new Converter();
    writeFileSync('./templates/default/index.html',
    `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Socket.io-doc</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/picnic">
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
                        <input id="server" value="ws://localhost:3000" class="two-third" type="text" placeholder="socket entry point" style="margin:0;">
                        <button onClick="toggleConnect()" id="connectBtn" class="sixth shyButton" style="margin:0;padding:0">Connect</button>
                        <button class="sixth pseudo button" style="margin:0;padding:0">Settings</button>
                    </div>
                </div>
            </div>
            <div class="flex three demo">
                <div class="full sixth-900">
                    <span class="emitsMenu">
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
    </html>
    <script>
        var socket;
        function toggleConnect() {
            if (socket && socket.connected) {
                socket.disconnect();
                let toggleConnectBtn=document.getElementById("connectBtn");
                toggleConnectBtn.textContent='Connect' ;
                return toggleConnectBtn.classList.remove('success');
            }

            socket = io.connect(document.getElementById('server').value, {transports: ['websocket'],});
            
            socket.on('connect',()=>{
                let toggleConnectBtn=document.getElementById("connectBtn");
                toggleConnectBtn.textContent='Disconnect';
                toggleConnectBtn.classList.add('success');
            });

            var onevent = socket.onevent;
            socket.onevent = function (packet) {
                var args = packet.data || [];
                onevent.call (this, packet);    // original call
                packet.data = ["*"].concat(args);
                onevent.call(this, packet);      // additional call to catch-all
            };

            socket.on("*",function(event,data) {
                console.log(event);
                console.log(data);
            });
        }
    </script>
    `
    )

    
})
.catch(e=>console.error(e));


