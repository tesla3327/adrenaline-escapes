var fs = require('fs');
const path = require('path');

const authorize = require('./authorize');
var google = require('googleapis');

let sheets;

const CLIENT_SECRET = {"installed":{"client_id":"203978181474-i8fj4obh0cp9oq4vv49egobrduhjsli3.apps.googleusercontent.com","project_id":"fifth-branch-158417","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"iHckTiZr-Nz1jsHXvctbjiEg","redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost"]}};
const SPREADSHEET_ID = '1eC7iQlZSrtJb_4YSv9IoTB0FjOU4oAYLVMZ11yG3hKk';

const DATE_COL = 0;
const TIME_COL = 1;
const NAME_COL = 2;
const EMAIL_COL = 3;
const PHONE_COL = 4;
const PARTY_SIZE_COL = 5;

const MILLISECONDS_IN_DAY = 86400 * 1000;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = './credentials/';
const CLIENT_SECRET_PATH = 'client_secret.json';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
const authorizeWithGoogle = (clientSecretPath) => {
  return new Promise( (resolve, reject) => {
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
    authorize(
      CLIENT_SECRET,
      SCOPES,
      TOKEN_PATH,
      TOKEN_DIR,
      resolve
    );
  });
};

/**
 * Get a Google Sheets object that has been authorized
 */
const getSheetsObject = auth => {
  sheets = google.sheets({ version: 'v4', auth });
}

/**
 * Wrap call to get values in a Promise
 */
const getValuesFromSheet = params => {
  return new Promise( (resolve, reject) => {
    sheets.spreadsheets.values.get(params, (err, response) => {
      if (err) {
        console.log('Error fetching spreadsheet:', err);
        reject(err);
      }

      resolve(response);
    });
  });
};

/**
 * Wrap call to update values in a Promise
 */
const updateValuesInSheet = (params, data) => {
  return new Promise( (resolve, reject) => {
    sheets.spreadsheets.values.update(params, (err, response) => {
      if (err) {
        console.log('Error updating spreadsheet:', err);
        reject(err);
      }

      resolve(response);
    });
  });
};

/**
 * Get the bookings from the spreadsheet into a nice JSON object
 *
 * The first row is a header:
 * Date, Time, Name, Email, Party Size
 */
const getAllBookings = () => {
  return getValuesFromSheet(
    {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Bookings',
    }
  )
  .then( response => {
    const values = response.values;

    // Remove the headers
    values.shift();

    // Map each to an object
    const bookings = values.map( (e, i) => {
      const date = new Date(Date.parse(e[DATE_COL]));

      return {
        date: date.valueOf() - (date.getTimezoneOffset() * 60 * 1000),
        dateString: e[DATE_COL],
        time: e[TIME_COL],
        name: e[NAME_COL],
        email: e[EMAIL_COL],
        phone: e[PHONE_COL],
        partySize: e[PARTY_SIZE_COL],
      }
    })
    .filter( e => e.date !== undefined && e.time !== undefined )
    // Add whether or not the time slot has been booked
    .map( e => {
      return Object.assign({}, e, { booked: !bookingIsAvailable(e) });
    });

    return bookings;
  });
};

const bookingIsAvailable = e => {
  return  e.date !== undefined &&
          e.time !== undefined &&
          e.name === undefined &&
          e.email === undefined &&
          e.partySize === undefined;
};

/**
 * Remove all personal data from the bookings object
 */
const scrubPersonalData = e => {
  return {
    date: e.date,
    dateString: e.dateString,
    time: e.time,
    booked: e.booked !== undefined ? e.booked : !bookingIsAvailable(e),
  };
};

/**
 * Groups the bookings list by date
 */
const groupByDate = bookings => {
  const grouped = bookings.reduce( (prev, next) => {

    if (!prev[next.date] || !prev[next.date].times) {
      prev[next.date] = {
        date: next.date,
        dateString: next.dateString,
        times: [],
      };
    }

    prev[next.date].times.push(next);

    return prev;
  }, {});

  return grouped;
};

/**
 * Groups all consecutive days together
 * Must be grouped by date first.
 */
const groupConsecutive = bookings => {
  const grouped = Object.keys(bookings).reduce( (prev, next) => {
    // Get the last date range
    const lastRange = prev[prev.length - 1];

    // Check if this date is one day after or not
    // console.log('End:', lastRange && lastRange.endDate);
    // console.log('next:', next - MILLISECONDS_IN_DAY);
    // console.log(lastRange && ((next - MILLISECONDS_IN_DAY) === lastRange.endDate));

    if (lastRange && ((next - MILLISECONDS_IN_DAY) === parseInt(lastRange.endDate, 10))) {
      // Add to last range
      lastRange.endDate = parseInt(next, 10);
      lastRange.dates.push( bookings[next] );
      // prev[prev.length - 1] = lastRange;
    } else {
      // Start new date range
      prev.push({
        startDate: parseInt(next, 10),
        endDate: parseInt(next, 10),
        dates: [ bookings[next] ],
      });
    }

    return prev;
  }, []);

  return grouped;
};

/**
 * Filter bookings down to what is available
 */
const getAvailableBookings = () =>
  getAllBookings().then( bookings => {
    return bookings
      .filter( e => bookingIsAvailable(e) );
  });

/**
 * Check to see if the requested spot is open, and then book it.
 */
const makeBooking = booking => {
  return getAllBookings().then( bookings => { 
    // Check where the spot is in the spreadsheet
    const index = bookings.findIndex( e => e.date === booking.date && e.time === booking.time );

    if ( index >= 0 && bookingIsAvailable(bookings[index])  ) {

      return updateValuesInSheet(
        {
          valueInputOption: 'USER_ENTERED',
          spreadsheetId: SPREADSHEET_ID,
          range: `Bookings!A${ index + 2 }:F${ index + 2 }`,
          includeValuesInResponse: true,  
          resource: {
            values: [ 
              [null, null, booking.name, booking.email, booking.phone, booking.partySize],
            ],
          }
        }
      );
    } else {
      const err = new Error('Slot already filled');
      err.errorCode = 404;
      throw err;
    }
  });
};

const initialize = () => {
  return authorizeWithGoogle(CLIENT_SECRET_PATH)
    .then( getSheetsObject )
    .then( () => console.log('Initialized Google Sheets API') );
};

module.exports = {
  initialize,
  getAllBookings,
  getAvailableBookings,
  makeBooking,
  scrubPersonalData,
  groupByDate,
  groupConsecutive,
  MILLISECONDS_IN_DAY
};

// init().then( getAvailableBookings ).then( console.log );




