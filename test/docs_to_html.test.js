var should = require('chai').should();
var chai =  require("chai");
var assert = require('assert');
const { extracted_docs_to_html } =  require('../lib');

describe('readdir function tests :', () => {
    it("it shoud return array of files", async()=>{
        let docs = [
            {
              tag: 'Messaging',
              description: 'Singleline or multiline description text. Line breaks are preserved111.',
              action: 'emit',
              event: 'send',
              example: '{"id": 1,"title": 5}'
            },
            {
              tag: 'Messaging',
              description: 'Singleline or multiline description text. Line breaks are preserved.',
              action: 'listen',
              event: 'onReceive',
              example: '5'
            },
            {
              tag: 'Messaging',
              description: 'Singleline or multiline description text. Line breaks are preserved111.',
              action: 'emit',
              event: 'send',
              example: '{"id": 1,"title": 5}'
            },
            {
              tag: 'Messaging',
              description: 'Singleline or multiline description text. Line breaks are preserved.',
              action: 'listen',
              event: 'onReceive',
              example: '5'
            }
          ]
        try{

         extracted_docs_to_html(docs)
        } catch (err){
            console.log(err)
        }
        // files.should.be.an('array')
    })
})