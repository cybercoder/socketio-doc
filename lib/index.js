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

// promisify commentParser load file.
exports.parse_file = file => new Promise((resolve,reject)=>{
    commentParser.file(file, (err,result)=>err ? reject(err) : resolve(result));
})
// make html constructor from tags that come from filtered tags.
const extracted_docs_to_html = docs =>{
    if(docs[0].action === "emit")
        return docs.reduce((result,doc)=> (`${result}<label><input type="checkbox" id="${doc.action}_${doc.event}" name="${doc.event}" value="${doc.event}"><span class="checkable">${doc.event}</span></label><br/>`),'');
    return docs.reduce((result,doc)=> (
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
}

exports.createLinks = items=>items.reduce((result,item)=>result+`<li><a href="#${item.action}_${item.event}">${item.event}</a></li>`,'');

exports.generate_html_template = (emitLinks,results)=>{
    return `<!DOCTYPE html>
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
        </script>`
}