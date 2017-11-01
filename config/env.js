/* eslint-disable no-global-assign */
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

module.exports = function env(express, app) {
	__dirname = app.get('__dirname');

  // View engine setup
	app.set('view engine', 'ejs');
	app.set('views', path.join(__dirname, 'views'));

  // Middleware
	app.use(cors());
	// app.use(morgan('dev'));
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
};
