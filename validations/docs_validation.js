


exports.docsSchema = {
    tag: { type: "enum", values: [ "socket.io-doc" ] },
    description: { type:'string' },
    action: { type: "enum", values: [ "emit", "listen" ] },
    event: { type:'string' } ,
    example: { type:'string' }
}