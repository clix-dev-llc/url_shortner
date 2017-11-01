/* eslint-disable */
/**
* Core Couchbase database file - Proceed with caution
* Purpose - Instantiate Couchbase, Ottoman and define core db methods.
*
* Wednesday 29, June 2016
*
* Database connectors
*      - Ottoman (ODM) #v1.0.6
*      - Couchbase node-sdk #v2.1.6
*
* Couchbase node-sdk class libraries (currently in use)::
*      - bucket (http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/Bucket.html)
*      - ViewQuery (http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/ViewQuery.html)
*      - SpatialViewQuery (http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/SpatialViewQuery.html)
*      - N1qlQuery (http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/N1qlQuery.html)
*
* CRUD Support methods::
*      - Create   => Ottoman			-> .save()
*
*      - Read     => Key 								-> .get() | .getMulti()
*                    (bucket)
*                 => Views								-> .from() | .fromSpatial()
*                    (ViewQuery && SpatialViewQuery)
*                 => Indexes							-> index name
*                    (Ottoman)
*                 => Specific fields as conditions		-> nickel query
*                    (N1qlQuery)
*
*      - Update   => Ottoman	-> .save()
*                 => bucket 	-> .upsert()
*                 => N1qlQuery	-> query statement
*
*      - Delete   => Ottoman	-> .save()
*                 => bucket 	-> .upsert() | .remove()
*                 => N1qlQuery	-> query statement
*
* Never trust on OTTOMAN ORM.
*/

'use strict';

/** Fetch all dependencies */
const config = require('../config');
const couchbase = require('couchbase');  // default bucket class
const ViewQuery = couchbase.ViewQuery;
const SpatialViewQuery = couchbase.SpatialViewQuery;
const N1qlQuery = couchbase.N1qlQuery;

/**
* Development views in couchbase starts with tag `dev_`
* while when they are published, the tag is removed.
*/
let viewEnv = '';
if (config.application.env !== 'production') {
	viewEnv = 'dev_';
}

/** Global `db` variable available across all methods */
let db;

/**
* Class representing Couchbase bucket instantiation
* @param host {string} - Couchbase cluser endpoint
* @param bucket {string} - Bucket to instantiate
* @param password {string} - Bucket password
* @method getDb() - Get Couchbase bucket
* @return db
*/
class Couchbase {
	constructor(host, bucket, bucketPassword) {
		this.host = host;
		this.bucket = bucket;
		this.password = bucketPassword;
	}

	/** Get Couchbase bucket */
	getDb() {
		/** Instantiate only if connection is shutdown */
		if (!db) {
			const cluster = new couchbase.Cluster(this.host);
			db = cluster.openBucket(this.bucket, this.password);
			db.on('error', function(err) {
			});
			db.operationTimeout = 120 * 1000;
			return db;
		}
	}
}

/**
* Instantiage new global instance of couchbase
*/
let couchbaseDb = new Couchbase(
	config.couchbase.endPoint,
	config.couchbase.bucket,
	config.couchbase.bucketPassword
);

/**
* Instantiates a `DefaultViewQuery` object for the specified
* design document and view name.
*
* http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/ViewQuery.html
*
* ViewQuery.from("newsstock", 'getAllNewsstock');
*
* newsstock   - View design document name
* getAllNewsstock - View inside design document
*/

/**
* Default view query
* @param designDocumentName
* @param viewName
* @param limit
* @param skip
* @param stale  (1 - BEFORE , 2 - NONE , 3 - AFTER)
* @param key
* @param group
*/
function defaultViewQuery (designDocumentName, viewName, key, group, limit, stale) {
	return new Promise(function(resolve, reject) {
		if (group === null) {
			group = false;
		}
		if (limit === null) {
			limit = 10;
		}
		if (stale === null || !stale) {
			stale = 2;
		}
		if (key !== null) {
			const vQuery = ViewQuery.from(`${viewEnv}${designDocumentName}`, viewName).key(key).group(group).stale(stale).limit(limit);
			viewQuery(vQuery, (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		} else {
			const vQuery = ViewQuery.from(`${viewEnv}${designDocumentName}`, viewName).group(group).stale(stale).limit(limit);
			viewQuery(vQuery, (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		}
	});
}

/**
* Instantiates a `SpatialViewQuery` object for the specified
* design document and view name.
*
* http://docs.couchbase.com/sdk-api/couchbase-node-client-2.0.0/SpatialViewQuery.html
*
* SpatialQuery.from("geodata", 'getAllTasksByGeoData');
*
* geodata   			  - View design document name
* getAllTasksByGeoData - View inside design document
*/

/**
* Spatial view query
* @param designDocumentName
* @param viewName
* @param limit
* @param skip
* @param stale
*  - Both default and spatial are totally seperate views and can have different params
*    and options at some stage. Though both are currently sharing the same viewQuery function
*    but at later stage that can be updated based on original function update.
*/
function spatialViewQuery (designDocumentName, viewName, limit, skip, stale, callback) {
	let query;
	if (limit !== null) {
		/** Add limit to query */
		query += `.limit(${limit})`;
		if (skip !== null) {
			/** Add skip to query */
			query += `.skip(${skip})`;
			if (stale !== null) {
				/**
				* Add default stale method to query
				*   - BEFORE	= 1
				*   - NONE	= 2
				*   - AFTER	= 3
				*/
				query += `.stale(stale)`;
			}
		}
	}
	const vQuery = SpatialQuery.from(`${viewEnv}${designDocumentName}`, viewName);
	vQuery += query.replace(/"([^"]+(?="))"/g, '$1');
	viewQuery(vQuery, (error, result) => {
		callback(error, rows, meta);
	});
}

/**
* This function needs lot more love
*/
function nickelQueryGen (argument, callback) {
	const sqlQuery = N1qlQuery.fromString(`SELECT * FROM ${config.couchbase.bucket}`);
}

/**
* Document get - get single document from key
* @param key
*/
function get (key, errorKey) {
	return new Promise((resolve, reject) => {
		couchbaseDb.getDb();
		db.get(key, (error, result) => {
			if (error) {
				let e = new Error(errorKey);
				e.generic = error;
				reject(e);
			} else {
				resolve(result.value);
			}
		});
	});
}

function getOptional (key) {
	return new Promise((resolve, reject) => {
		couchbaseDb.getDb();
		db.get(key, (error, result) => {
			if (result === null) {
				resolve(result);
			} else {
				resolve(result.value);
			}
		});
	});
}

/**
* Document getMultiAll - get multiple document from multiple keys
* @param keys
*/
function getMultiAll(keys) {
	return new Promise((resolve, reject) => {
		couchbaseDb.getDb();
		db.getMulti(keys, (error, results) => {
			if (error) {
				reject(new Error('UNABLE_PROCESS_REQUEST'));
			} else {
				resolve(results);
			}
		});
	});
}

function getMulti(keys) {
	return new Promise((resolve, reject) => {
		couchbaseDb.getDb();
		db.getMulti(keys, (error, results) => {
			resolve(results);
		});
	});
}

/**
* Document viewQuery - for all queries on views
* @param viewQuery
*/
function viewQuery (viewQuery, callback) {
	couchbaseDb.getDb();
	db.query(viewQuery, (error, rows, meta) => {
		callback(error, rows, meta);
	});
}

/**
* Document nickelQuery - for all queries using N1ql
* @param nickelQuery
*/
function nickelQuery (nickelQuery) {
	return new Promise((resolve, reject) => {
		couchbaseDb.getDb();
		db.query(nickelQuery, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
	// couchbaseDb.getDb();
	// db.query(nickelQuery, (error, result) => {
	// 	callback(error, result);
	// });
}

/**
* Document docDelete - permanently remove document form database
* @param key
*/
function docDelete (key) {
	return new Promise((resolve,reject) => {
		couchbaseDb.getDb();
		db.remove(key, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}

/**
* Document upsert - insert or update document
* @param key
* @param val
*/
function upsert (key, val) {
	return new Promise((resolve,reject) => {
		couchbaseDb.getDb();
		db.upsert(key, val, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}

function incr (key, val) {
	return new Promise((resolve,reject) => {
		couchbaseDb.getDb();
		db.counter(key, val, {initial: 0}, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result.value);
			}
		});
	});
}

module.exports.get = get;
module.exports.incr = incr;
module.exports.getOptional = getOptional;
module.exports.getMultiAll = getMultiAll;
module.exports.getMulti = getMulti;
module.exports.viewQuery = viewQuery;
module.exports.nickelQuery = nickelQuery;
module.exports.docDelete = docDelete;
module.exports.upsert = upsert;
module.exports.defaultViewQuery = defaultViewQuery;
module.exports.spatialViewQuery = spatialViewQuery;
module.exports.nickelQueryGen = nickelQueryGen;
module.exports.ODMBucket = couchbaseDb.getDb();
module.exports.getDb = couchbaseDb.getDb();
