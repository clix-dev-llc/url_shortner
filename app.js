/* eslint-disable import/no-dynamic-require */
const express = require('express');
const path = require('path');

const opts = require(path.join(__dirname, 'config', 'opts.js'));
const app = express();

// Gotta Catch 'Em All
process.addListener('uncaughtException', (err, stack) => {
	console.log(`Caught exception: ${err}\n${err.stack}`);
	console.log('\u0007'); // Terminal bell
});

// Common options
app.set('__dirname', __dirname);
app.set('opts', opts);
app.set('x-powered-by', false);

// Load express configuration
require(path.join(__dirname, 'config', 'env.js'))(express, app);

// Load routes
require(path.join(__dirname, 'routes'))(app);

// Start HTTP server
app.listen(opts.port, () => {
	console.log('Express server listening on port %d in %s mode',
    opts.port, app.settings.env
  );
	console.log('Running on %s (Press CTRL+C to quit)', opts.url);
});
