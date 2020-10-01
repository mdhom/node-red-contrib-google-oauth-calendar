function authenticate(msg, node, googleCredentials, callback) {
    try
    {
        if (googleCredentials !== null && googleCredentials !== undefined)
        {
            if (googleCredentials.credentials.tokenData !== null && googleCredentials.credentials.tokenData !== undefined)
            {
                const oAuth2Client = new google.auth.OAuth2(
                    googleCredentials.credentials.clientId, 
                    googleCredentials.credentials.clientSecret, 
                    googleCredentials.credentials.redirectUri);
        
                oAuth2Client.setCredentials(JSON.parse(googleCredentials.credentials.tokenData));

                callback(oAuth2Client, node);
            }
            else 
            {
                node.status({fill:"red",shape:"dot",text:"Error: No AccessToken"});
            }
        }
        else
        {
            node.status({fill:"red",shape:"dot",text:"Error: No Credentials"});
        }
    } catch (err) {
        node.status({fill:"red",shape:"dot",text:"Exception: " + err});
    }
}

module.exports = { 
    authenticate: authenticate
};