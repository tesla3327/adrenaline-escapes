var fs = require('fs');

const authorize = require('./authorize');
var google = require('googleapis');

let sheets;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = './credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
const authorizeWithGoogle = () => {
  return new Promise( (resolve, reject) => {
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Google Sheets API.
      authorize(
        JSON.parse(content),
        SCOPES,
        TOKEN_PATH,
        TOKEN_DIR,
        resolve
      );
    });
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

// const writeValue = sheets => {
//   return updateValuesInSheet(
//     sheets,
//     {
//       valueInputOption: 'USER_ENTERED',
//       spreadsheetId: '1b5LiqAKF9svaWi7vNPkyRvKFa_DNAtOHpvQNh8rZvlI',
//       range: 'Class Data!G4',
//       includeValuesInResponse: true,      
//       resource: {
//         values: [ 
//           ['Hello there'],
//         ],
//       }
//     }
//   )
//   .then( console.log )
//   .catch( console.error );
// };

// const printExtraCurricularActivities = sheets => {
//   return getValuesFromSheet(sheets, {
//     spreadsheetId: '1b5LiqAKF9svaWi7vNPkyRvKFa_DNAtOHpvQNh8rZvlI',
//     range: 'Class Data!F2:F',
//   }).then( response => {
//     console.log('Extra curricular stuff:');

//     const activities = new Set(
//       response.values
//         .map( row => row[0] )
//     );

//     activities.forEach( e => console.log(e) );

//     return sheets;
//   })
//   .catch( console.err );
// };

/**
 * Get the bookings from the spreadsheet into a nice JSON object
 *
 * The first row is a header:
 * Date, Time, Name, Email, Party Size
 */
const getBookings = () => {
  return getValuesFromSheet(
    {
      spreadsheetId: '1b5LiqAKF9svaWi7vNPkyRvKFa_DNAtOHpvQNh8rZvlI',
      range: 'Bookings',
    }
  )
  .then( response => {
    const values = response.values;

    // Remove the headers
    values.shift();

    // Map each to an object
    const bookings = values.map( e => {
      return {
        date: e[0],
        time: e[1],
        name: e[2],
        email: e[3],
        partySize: e[4],
      }
    })
    .filter( e => e.date !== undefined && e.time !== undefined );

    return bookings;
  });
};

/**
 * Filter bookings down to what is available
 */
const getAvailableBookings = () =>
  getBookings( bookings => bookings.filter( e => {
    return  e.date !== undefined &&
            e.time !== undefined &&
            e.name === undefined &&
            e.email === undefined &&
            e.partySize === undefined;
    })
  );

// const groupBookingsByDay = bookings => {
//   // Get a list of unique days
//   const days = new Set(
//     bookings
//       .map( e => e.date )
//   );

//   // Group by day
//   const groupedBookings = {};
//   days.forEach( day => {
//     groupedBookings[day] = bookings.filter( e => e.date === day );
//   });

//   console.log(groupedBookings);
// };

const init = () => {
  return authorizeWithGoogle()
    .then( getSheetsObject );
};

init().then( getAvailableBookings ).then( console.log );











