const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sheets = require('./sheets');

sheets.initialize().then(() => {
	// sheets.getAllBookings()
	// 	.then( bookings => {
	// 		const data = sheets.groupByDate(bookings.map( sheets.scrubPersonalData ));
	// 	});	
});


// Define constants
const PORT = process.env.PORT || 3000;

// CORS support
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use( bodyParser.json() );

/**
 * Return only the available bookings
 */
app.get('/bookings', (req, res) => {
	// We want all the bookings, but to make sure that no personal data is sent
	sheets.getAllBookings()
		.then( bookings => {
			const data = sheets.groupByDate(bookings.map( sheets.scrubPersonalData ));
			res.send(data);
		});
});

/**
 * Attempt to make a booking
 */
app.post('/booking', (req, res) => {
	console.log('Making booking:');
	console.log(req.body);
	sheets.makeBooking(req.body)
		.then( () => res.sendStatus(200) )
		.catch( err => res.sendStatus(err.errorCode) );
});

app.listen(PORT, () => {
  console.log(`API started on port ${PORT}`);
});

