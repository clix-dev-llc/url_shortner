/* eslint-disable no-useless-escape,no-param-reassign*/
const url = require('url');
const model = require('./model');
const config = require('../config');

function checkUrl(s, domain) {
	const regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
	let	valid = true;

    // Url correct
	if (regexp.test(s) !== true) {
		valid = false;
	}

    // Url equal application url
	if (valid === true && domain === true) {
		if (url.parse(config.application.url).hostname === url.parse(s).hostname) {
			valid = false;
		}
	}

	return valid;
}

module.exports = {
	expand: (shortUrl, callback, click, request) => {
		if (checkUrl(shortUrl)) {
			shortUrl = shortUrl.split('/').pop();
		}
		if (shortUrl && /^[\w=]+$/.test(shortUrl)) {
			model.get(shortUrl, callback, click, request);
		} else {
			callback(400);
		}
	},

	getDetail: (shortUrl, callback, click) => {
		if (checkUrl(shortUrl)) {
			shortUrl = shortUrl.split('/').pop();
		}
		if (shortUrl && /^[\w=]+$/.test(shortUrl)) {
			model.getDetail(shortUrl, callback, click);
		} else {
			callback(400);
		}
	},

	getList: (pageNum, pageSize, sortParam, callback) => {
		model.getList(pageNum, pageSize, sortParam, callback);
	},

	shorten: (longUrl, callback) => {
		if (checkUrl(longUrl, true)) {
			model.set(longUrl, callback);
		} else {
			callback(400);
		}
	},
};
