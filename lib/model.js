const moment = require('moment');
const base58 = require('base58');
const crypto = require('crypto');
const N1qlQuery = require('couchbase').N1qlQuery;
const useragent = require('useragent');
const uuidV4 = require('uuid/v4');
const config = require('../config');
const db = require('./db');
const nus = require('../lib/nus');

useragent(true);
const bucket = config.couchbase.bucket;

// General prefix
const _prefix_ = 'u:';

function kHash(hash) {
	return `${_prefix_}hash:${hash}`;
}

function kUrl(url) {
	return `${_prefix_}url:${md5(url)}`;
}

function kCounter() {
	return `${_prefix_}counter`;
}

function kClick() {
	return `${_prefix_}click:${uuidV4()}`;
}

function findHash(shortUrl, callback) {
	db.getOptional(kHash(shortUrl))
  .then((doc) => {
	if (typeof callback === 'function') {
		callback(null, doc);
	}
})
  .catch((err) => {
	callback(err, null);
});
}

function findUrl(longUrl, callback) {
	db.getOptional(kUrl(longUrl))
	.then((reply) => {
		if (typeof callback === 'function') {
			callback(null, reply ? reply.hash : null);
		}
	})
	.catch((err) => {
		callback(err, null);
	});
}

function findTrack(shortUrl, callback) {
	const statement = `select time as date,count(time) as click from \`${bucket}\` where type='click' and hash='${shortUrl}' group by time order by time desc limit 30;`;
	const query = N1qlQuery.fromString(statement);
	db.nickelQuery(query).then(result => {
		if (result[0].click === 0) {
			result = [];
		}
    callback(null, result);
	})
	.catch(e => {
		callback(e, null);
	});
}

function clickLink(shortUrl, request) {
	return new Promise((resolve, reject) => {
		const statement = `UPDATE \`${bucket}\` USE KEYS "${kHash(shortUrl)}" set
		clicks = (clicks + 1) RETURNING *;`;
		const query = N1qlQuery.fromString(statement);
		db.nickelQuery(query)
		.then((result) => {
			const doc = getRequestData(request);
			doc.hash = shortUrl;
			doc.time = moment().format('YYYY-MM-DD');
			doc.type = 'click';
			return db.upsert(`${kClick()}`,doc);
		})
		.then(dbResult => {
			resolve(dbResult);
		})
		.catch(e => {
		  reject(e);
		});
	});
}

function getListByPage(pageNum, pageSize, sortParam) {
	return new Promise((resolve, reject) => {
		let output;
		let sortParameter = 'date';
		if (sortParam) {
			sortParameter = sortParam;
		}
		let statement = `SELECT clicks,date,"${config.application.url}/" || hash as shortUrl,hash,url as longUrl FROM \`${bucket}\` URL WHERE type = 'hash' ORDER BY ${sortParameter} DESC LIMIT ${pageSize || 20} OFFSET ${(pageSize || 20)*((pageNum || 1)-1)};`;
		let query = N1qlQuery.fromString(statement);
		db.nickelQuery(query)
		.then((result1) => {
			output = {
				urls:result1,
			}
			statement = `select count(*) as count from \`${bucket}\` where type = 'hash';`;
			query = N1qlQuery.fromString(statement);
			return db.nickelQuery(query)
		})
		.then((result2) => {
			output.totalCount = result2[0].count;
			resolve(output);
		})
		.catch((e) => {
			console.log(e);
			reject(e);
		});
	});
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function uniqId(callback) {
	db.incr(kCounter(), 1)
	.then((reply) => {
		const hash = base58.encode(getRandomInt(9999, 999999) + reply.toString());
		if (typeof callback === 'function') {
			callback(null, hash);
		}
	})
	.catch((err) => {
		callback(err, null);
	});
}

function md5(url) {
	return crypto.createHash('md5').update(url).digest('hex');
}

function getRequestData(request) {
	const agent = useragent.parse(request.headers['user-agent']);
	const ip = getCallerIP(request);
	const data = {
		browserName: `${agent.family}`,
		browserVersion: `${agent.major}.${agent.minor}.${agent.patch}`,
		deviceName: `${agent.device.family}`,
		deviceVersion: `${agent.device.major}.${agent.device.minor}.${agent.device.patch}`,
		osName: `${agent.os.family}`,
		osVersion: `${agent.os.major}.${agent.os.minor}.${agent.os.patch}`,
		ip: ip[0] || ''
	};
	return data;
}

function getCallerIP(request) {
	let ip = request.headers['x-forwarded-for'] ||
			request.connection.remoteAddress ||
			request.socket.remoteAddress ||
			request.connection.socket.remoteAddress;
	ip = ip.split(',')[0];
	ip = ip.split(':').slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
	return ip;
}

module.exports = {
	getDetail: (shortUrl, callback, click) => {
		findHash(shortUrl, (err, reply) => {
			if (err) {
				callback(500);
			} else if (reply && 'url' in reply) {
				reply.longUrl = reply.url;
				reply.shortUrl = `${config.application.url}/${reply.hash}`;
				delete reply['url'];
				findTrack(shortUrl, (errT, replyT) => {
					if (errT) {
						callback(500);
					} else {
						reply.track = replyT;
						callback(null, reply);
					};
				});
			} else {
				callback(404);
			}
		});
	},

	get: (shortUrl, callback, click, request) => {
		findHash(shortUrl, (err, reply) => {
			if (err) {
				callback(500);
			} else if (reply && 'url' in reply) {
				if (click) {
					clickLink(reply.hash, request);
				}
				callback(null, {
					hash: reply.hash,
					long_url: reply.url,
					clicks: reply.clicks || 0
				});
			} else {
				callback(404);
			}
		});
	},

	getList: (pageNum, pageSize, sortParam, callback) => {
		getListByPage(pageNum, pageSize, sortParam)
		.then(result => {
			callback(null,result);
		})
		.catch(e => {
			callback(500);
		});
	},

	set: (longUrl, callback) => {
		findUrl(longUrl, (err, reply) => {
			if (err) {
				callback(500);
			} else if (reply) {
				callback(null, {
					hash: reply,
					longUrl
				});
			} else {
				uniqId((err1, hash) => {
					if (err1) {
						callback(500);
					} else {
						const response = {
							hash,
							longUrl
						};
						db.upsert(kUrl(longUrl), { hash: response.hash })
            .then(() => {
							return db.upsert(kHash(response.hash), {
								url: longUrl,
								hash: response.hash,
								clicks: 0,
								date: new Date().getTime(),
								type: 'hash'
							});
						})
            .then(() => {
							callback(null, response);
						})
            .catch((e) => {
							callback(503);
						});
					}
				});
			}
		});
	},
};
module.exports.kCounter = kCounter;
module.exports.kUrl = kUrl;
module.exports.kHash = kHash;
module.exports.md5 = md5;
module.exports.uniqId = uniqId;
module.exports._prefix_ = _prefix_;
