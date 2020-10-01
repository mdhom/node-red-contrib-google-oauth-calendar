const {google} = require('googleapis');

function authenticate(credentials, callback) {
    try
    {
        if (credentials.tokenData !== null && credentials.tokenData !== undefined)
        {
            const oAuth2Client = new google.auth.OAuth2(
                credentials.clientId, 
                credentials.clientSecret, 
                credentials.redirectUri);
    
            oAuth2Client.setCredentials(JSON.parse(credentials.tokenData));

            callback(undefined, oAuth2Client);
        }
        else 
        {
            callback("No AccessToken", undefined);
        }
    } catch (err) {
        callback("Exception: " + err, undefined);
    }
}

module.exports = { 
    authenticate: authenticate
};