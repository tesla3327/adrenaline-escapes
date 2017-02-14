var fs = require('fs');
var readline = require('readline');
var googleAuth = require('google-auth-library');

const TOKEN = {"access_token":"ya29.GlvvA1woYTT5BNLkVSCWhrDWJGCiRZexXHvfZeqSKt6-FZzg7_AgnL6awqhf6l2NdFKPh-CZ61B1GFd5AfRzxB3Sj3XlL7c-eSqJquiv4yR0zcj8d1lFWTtnZpwh","refresh_token":"1/x0YNTxa92A0CGY4YrY1DcDzfeawGuktF2RgQHkR3Ja8","token_type":"Bearer","expiry_date":1486843368311};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
let tokenPath = '';
let tokenDir = '';
function authorize(credentials, scopes, _tokenPath, _tokenDir, callback) {
  tokenPath = _tokenPath;
  tokenDir = _tokenDir;

  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  oauth2Client.credentials = TOKEN;
  callback(oauth2Client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, scopes, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(tokenDir);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(tokenPath, JSON.stringify(token));
  console.log('Token stored to ' + tokenPath);
}


module.exports = authorize;


