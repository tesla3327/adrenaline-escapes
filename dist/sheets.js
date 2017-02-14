'use strict';

var fs = require('fs');
var path = require('path');

// Automatically polyfill for Promises;
require('es6-promise').polyfill();

var authorize = require('./authorize');
var google = require('googleapis');

var sheets = void 0;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = './credentials/';
var CLIENT_SECRET_PATH = 'client_secret.json';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
var authorizeWithGoogle = function authorizeWithGoogle(clientSecretPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(clientSecretPath, function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Google Sheets API.
      authorize(JSON.parse(content), SCOPES, TOKEN_PATH, TOKEN_DIR, resolve);
    });
  });
};

/**
 * Get a Google Sheets object that has been authorized
 */
var getSheetsObject = function getSheetsObject(auth) {
  sheets = google.sheets({ version: 'v4', auth: auth });
};

/**
 * Wrap call to get values in a Promise
 */
var getValuesFromSheet = function getValuesFromSheet(params) {
  return new Promise(function (resolve, reject) {
    sheets.spreadsheets.values.get(params, function (err, response) {
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
var updateValuesInSheet = function updateValuesInSheet(params, data) {
  return new Promise(function (resolve, reject) {
    sheets.spreadsheets.values.update(params, function (err, response) {
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
var getAllBookings = function getAllBookings() {
  return getValuesFromSheet({
    spreadsheetId: '1b5LiqAKF9svaWi7vNPkyRvKFa_DNAtOHpvQNh8rZvlI',
    range: 'Bookings'
  }).then(function (response) {
    var values = response.values;

    // Remove the headers
    values.shift();

    // Map each to an object
    var bookings = values.map(function (e, i) {
      return {
        date: e[0],
        time: e[1],
        name: e[2],
        email: e[3],
        partySize: e[4]
      };
    }).filter(function (e) {
      return e.date !== undefined && e.time !== undefined;
    });

    return bookings;
  });
};

var bookingIsAvailable = function bookingIsAvailable(e) {
  return e.date !== undefined && e.time !== undefined && e.name === undefined && e.email === undefined && e.partySize === undefined;
};

/**
 * Filter bookings down to what is available
 */
var getAvailableBookings = function getAvailableBookings() {
  return getAllBookings().then(function (bookings) {
    return bookings.filter(function (e) {
      return bookingIsAvailable(e);
    });
  });
};

/**
 * Check to see if the requested spot is open, and then book it.
 */
var makeBooking = function makeBooking(booking) {
  return getAllBookings().then(function (bookings) {
    // Check where the spot is in the spreadsheet
    var index = bookings.findIndex(function (e) {
      return e.date === booking.date && e.time === booking.time;
    });

    if (index >= 0 && bookingIsAvailable(bookings[index])) {

      return updateValuesInSheet({
        valueInputOption: 'USER_ENTERED',
        spreadsheetId: '1b5LiqAKF9svaWi7vNPkyRvKFa_DNAtOHpvQNh8rZvlI',
        range: 'Bookings!A' + (index + 2) + ':E' + (index + 2),
        includeValuesInResponse: true,
        resource: {
          values: [[null, null, booking.name, booking.email, booking.partySize]]
        }
      });
    } else {
      var err = new Error('Slot already filled');
      err.errorCode = 404;
      throw err;
    }
  });
};

var initialize = function initialize() {
  return authorizeWithGoogle(CLIENT_SECRET_PATH).then(getSheetsObject).then(function () {
    return console.log('Initialized Google Sheets API');
  });
};

module.exports = {
  initialize: initialize,
  getAllBookings: getAllBookings,
  getAvailableBookings: getAvailableBookings,
  makeBooking: makeBooking
};

// init().then( getAvailableBookings ).then( console.log );