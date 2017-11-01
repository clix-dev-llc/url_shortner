/* eslint-disable global-require */
const http = require('http');
const nus = require('../lib/nus');

module.exports = function route(app) {
	const api = require('./api.js')(app);
  // api routes
	app.use('/api/v1', api);

  // index route
	app.route('/').all((req, res) => {
		res.redirect(301, 'https://www.sellnews.com/');
	});

  // shorten route
	app.get(/^\/([\w=]+)$/, (req, res, next) => {
		nus.expand(req.params[0], (err, reply) => {
			if (err) {
				next();
			} else {
				res.redirect(301, reply.long_url);
			}
		}, true, req);
	});

  // catch 404 and forwarding to error handler
	app.use((req, res, next) => {
		const err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

  // development error handler
  // will print stacktrace
	if (app.get('env') === 'development') {
		app.use((err, req, res, next) => {
			console.log(`Caught exception: ${err}\n${err.stack}`);
			res.status(err.status || 500);
			if (/^\/api\/v1/.test(req.originalUrl)) {
				res.json({
					status_code: err.status || 500,
					status_txt: http.STATUS_CODES[err.status] || http.STATUS_CODES[500]
				});
			} else {
				res.render('error', {
					code: err.status || 500,
					message: err.message,
					error: err
				});
			}
		});
	}

  // production error handler
  // no stacktraces leaked to user
	app.use((err, req, res, next) => {
		res.status(err.status || 500);
		if (/^\/api\/v1/.test(req.originalUrl)) {
			res.json({
				status_code: err.status || 500,
				status_txt: http.STATUS_CODES[err.status] || ''
			});
		} else {
			res.redirect('https://www.sellnews.com/404page');
		}
	});
};
