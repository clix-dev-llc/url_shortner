/* eslint-disable */
let request = require('superagent'),
	mock = require('superagent-mocker')(request),
	expect = require('expect.js'),
	nus = require('../lib/nus');

describe('Test Node Url Shortener - Nus', () => {
	let longUrl,
		sortUrl;

	beforeEach(() => {
		longUrl = 'http://example.com';
		sortUrl = 'foo';
	});

	it('should shorten', (done) => {
		nus.shorten(longUrl, (err, reply) => {
			expect(err).to.be(null);
			expect(reply).to.not.be.empty();
			expect(reply).to.only.have.keys('hash', 'longUrl');
			expect(reply.hash).to.match(/[\w=]+/);
			expect(reply.longUrl).to.be(longUrl);
			done();
		});
	});

	it('should expand', (done) => {
		nus.shorten(longUrl, (err, reply) => {
			expect(err).to.be(null);
			expect(reply).to.not.be.empty();
			expect(reply).to.only.have.keys('hash', 'longUrl');
			expect(reply.hash).to.match(/[\w=]+/);
			expect(reply.longUrl).to.be(longUrl);
			done();
		});
	});
});
