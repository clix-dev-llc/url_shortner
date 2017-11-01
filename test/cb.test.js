/* eslint-disable */
let request = require('superagent'),
	mock = require('superagent-mocker')(request),
	expect = require('expect.js'),
	CBModel = require('../lib/model.js'),
	fakeCBModel;

describe('Test Node Url Shortener - CBModel', () => {
	let prefix,
		longUrl,
		shortUrl;

	beforeEach(() => {
		// fakeCBModel = require('fakeCBModel').createClient(0, 'localhost', { fast: true });
		// CBModel = new CBModel(null, fakeCBModel);
		prefix = CBModel._prefix_;
		longUrl = 'http://example.com';
		shortUrl = 'foo';
	});

	it('kCounter should return CBModel key', (done) => {
		const data = CBModel.kCounter();
		expect(data).to.be.a('string');
		expect(data).to.be(`${prefix}counter`);
		done();
	});

	it('kUrl should return CBModel key', (done) => {
		const data = CBModel.kUrl(longUrl);
		expect(data).to.be.a('string');
		expect(data).to.be(`${prefix}url:a9b9f04336ce0181a08e774e01113b31`);
		done();
	});

	it('kHash should return CBModel key', (done) => {
		const data = CBModel.kHash(shortUrl);
		expect(data).to.be.a('string');
		expect(data).to.be(`${prefix}hash:foo`);
		done();
	});

	it('md5 should return MD5 hash', (done) => {
		const data = CBModel.md5(longUrl);
		expect(data).to.be.a('string');
		expect(data).to.be('a9b9f04336ce0181a08e774e01113b31');
		done();
	});

	it('uniqId should return unique CBModel key', (done) => {
		CBModel.uniqId((err, hash) => {
			expect(err).to.be(null);
			expect(hash).to.be.a('string');
			expect(hash).to.match(/[\w=]+/);
			done();
		});
	});
});
