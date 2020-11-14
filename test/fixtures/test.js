const ehpi = require('../../index.js');
const assert = require('assert');

// mock proxy object
const mproxy = new ehpi();

describe('ehpi', () => {
  describe('prototype', () => {
    const fns = Object.keys(mproxy);
    console.log(fns)
    it('was successfully instantiated', () => {
        assert.ok(fns);
        assert(fns.length);
    });
    it('has handlers defined', () => {
        assert(fns.filter(el=>el.startsWith('on')).length);
    });
    it('catches errors accordingly', () => {
        assert(fns.filter(el=>el.endsWith('Error')).length);
    });
  });
});

