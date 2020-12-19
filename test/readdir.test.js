var should = require('chai').should();
var chai =  require("chai");
var assert = require('assert');
const { get_files } =  require('../lib');

describe('readdir function tests :', () => {
    it("it shoud return array of files", async()=>{
        let dirs = ['./*.js']
        let files = await get_files(dirs)
        files.should.be.an('array')
    })
    it("it shoud raise an error about typeof params", async()=>{
        try{
            await get_files({a:22})
        }
        catch (error){
            chai.expect(error).to.be.an("Error")
        }
    })
    it("it shoud raise an error about typeof params", async()=>{
        try{
            await get_files(["path"])
        }
        catch (error){
            chai.expect(error).to.be.an("Error")
        }
    })
})