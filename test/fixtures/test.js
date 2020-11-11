const ehpi = require('../../index.js');
const assert = require('assert');

// mock proxy object
const mproxy = new ehpi();

describe('ehpi', () => {
	describe('prototype', () => {
		const fns = Object.keys(mproxy);
		
		it('has utility functions defined', () => {
			 assert(fns.filter(el=>el[0]=='_').length > 0);
		});
	})
});
