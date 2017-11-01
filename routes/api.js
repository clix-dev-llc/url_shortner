/* eslint-disable no-param-reassign */
const http = require('http');
const nus = require('../lib/nus');
const router = require('express').Router();

module.exports = function api(app) {
	const opts = app.get('opts');

	router.route('/shorten')
    .post((req, res) => {
	nus.shorten(req.body.long_url, (err, reply) => {
		if (err) {
			jsonResponse(res, err);
		} else if (reply) {
			reply.shortUrl = `${opts.url.replace(/\/$/, '')}/${reply.hash}`;
			jsonResponse(res, 200, reply);
		} else {
			jsonResponse(res, 500);
		}
	});
});

	router.route('/expand')
    .post((req, res) => {
	nus.expand(req.body.short_url, (err, reply) => {
		if (err) {
			jsonResponse(res, err);
		} else if (reply) {
			jsonResponse(res, 200, reply);
		} else {
			jsonResponse(res, 500);
		}
	});
});

	router.route('/expand/:short_url')
    .get((req, res) => {
	nus.expand(req.params.short_url, (err, reply) => {
		if (err) {
			jsonResponse(res, err);
		} else if (reply) {
			jsonResponse(res, 200, reply);
		} else {
			jsonResponse(res, 500);
		}
	});
});

router.route('/detail')
	.post((req, res) => {
		nus.getDetail(req.body.short_url, (err, reply) => {
			if (err) {
				jsonResponse(res, err);
			} else if (reply) {
				jsonResponse(res, 200, reply);
			} else {
				jsonResponse(res, 500);
			}
		});
});

router.route('/list')
	.get((req, res) => {
		nus.getList(req.query.pageNum, req.query.pageSize,req.query.sortParam, (err, reply) => {
			if (err) {
				jsonResponse(res, err);
			} else if (reply) {
				jsonResponse(res, 200, reply);
			} else {
				jsonResponse(res, 500);
			}
		});
});

	function jsonResponse(res, code, data) {
		data = data || {};
		data.status_code = (http.STATUS_CODES[code]) ? code : 503;
		data.status_txt = http.STATUS_CODES[code] || http.STATUS_CODES[503];

		res.status(data.status_code).json(data);
	}

	return router;
};
