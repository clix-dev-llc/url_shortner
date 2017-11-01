module.exports = {
	application: {
		autoprovision: true,
		env: 'development',
		hostName: 'localhost',
		httpPort: 3000,
		dataSource: 'embedded',
		wait: 3000,
		checkInterval: 1000,
		verbose: false,
		audience: 'api-tenant-1',
		algorithms: ['HS256'],
		url: 'http://ridham.co'
	},
	couchbase: {
		endPoint: 'couchbase://54.144.43.128/:8091',
		n1qlService: 'http://54.144.43.128/:8093',
		hostName: 'http://54.144.43.128',
		bucket: 'url',
		bucketPassword: '',
		user: 'Administrator',
		password: 'i-30fe10af',
		dataPath: '',
		indexPath: '',
		indexType: 'gsi',
		indexerStorageMode: 'forestdb',
		showQuery: false,
		indexMemQuota: 2048,
		dataMemQuota: 1024,
		thresholdItemCount: 0
	},
};
