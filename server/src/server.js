const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sheets = require('./sheets');

sheets.initialize().then(() => {
	// sheets.getAllBookings()
	// 	.then( bookings => {
	// 		let data = sheets.groupByDate(bookings.map( sheets.scrubPersonalData ));
	// 		data = sheets.groupConsecutive(data);
	// 		console.log(JSON.stringify(data, null, 2));
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
			// Remove any personally identifiable information
			const scrubbed = bookings.map( sheets.scrubPersonalData );

			// Remove any bookings that are in the past
			const today = new Date(Date.now());

			// Convert to epoch and adjust for timezone
			// Timezone offset is in minutes
			let todayEpoch = today.valueOf() - (today.getTimezoneOffset() * 60 * 1000);

			// Remove seconds and milliseconds, because we only have the year, month day
			// in the date from the spreadsheet
			todayEpoch = todayEpoch - (todayEpoch % (1000 * 60 * 60 * 24));

			// Go back one day to allow timezones behind UTC to have "today"
			var yesterdayEpoch = todayEpoch - sheets.MILLISECONDS_IN_DAY;

			const filtered = scrubbed.filter( e => e.date >= yesterdayEpoch );

			// Group them by date so they are easier to work with
			let data = sheets.groupByDate( scrubbed );

			// Group consecutive dates into date ranges
			data = sheets.groupConsecutive(data)

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

