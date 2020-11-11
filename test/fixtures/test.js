const ehpi = require('../../index.js');
const assert = require('assert');

// mock proxy object
const mproxy = new ehpi();

describe('ehpi', () => {
	describe('prototype', () => {
		const fns = Object.keys(mproxy);
		it('was successfully instantiated', () => {
			assert(fns.length);
		});
		it('has handlers defined', () => {
			 assert(fns.filter(el=>el.startsWith('on')).length);
		});
	})
});

