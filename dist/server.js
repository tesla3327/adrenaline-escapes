'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sheets = require('./sheets');

sheets.initialize();

// Define constants
var PORT = 3000;

app.use(express.static('./public'));

// CORS support
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(bodyParser.json());

/**
 * Return only the available bookings
 */
app.get('/bookings', function (req, res) {
	sheets.getAvailableBookings().then(function (bookings) {
		res.send(bookings);
	});
});

/**
 * Attempt to make a booking
 */
app.post('/booking', function (req, res) {
	console.log('Making booking:');
	console.log(req.body);
	sheets.makeBooking(req.body).then(function () {
		return res.sendStatus(200);
	}).catch(function (err) {
		return res.sendStatus(err.errorCode);
	});
});

app.listen(PORT, function () {
	console.log('API started on port ' + PORT);
});