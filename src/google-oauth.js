module.exports = function(RED) {
    const {google} = require('googleapis');
    
    function googleCredentials(config) {
        RED.nodes.createNode(this,config);
        this.name   = config.name;
    }
    
    RED.nodes.registerType("googleCredentials", googleCredentials, {
		credentials: {
			clientId:        { type:"text", required: true },
            clientSecret:    { type:"text", required: true },
            redirectUri:     { type:"text", required: true },
            tokenData:       { type:"text" }
		}
    });

    RED.httpAdmin.get('/google-credentials/authUrl/:clientSecret/:clientId/:redirectUri', function(req, res){
        const client_secret = decodeURIComponent(req.params.clientSecret);
        const client_id = decodeURIComponent(req.params.clientId);
        const redirect_uri = decodeURIComponent(req.params.redirectUri);
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
        const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        res.end("{ \"authUrl\": \"" + authUrl + "\" }");
    });

    RED.httpAdmin.get('/google-credentials/token/:code/:nodeId/:clientSecret/:clientId/:redirectUri', function(req, res){
        var node = RED.nodes.getNode(req.params.nodeId);

        const client_secret = decodeURIComponent(req.params.clientSecret);
        const client_id = decodeURIComponent(req.params.clientId);
        const redirect_uri = decodeURIComponent(req.params.redirectUri);
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

        oAuth2Client.getToken(decodeURIComponent(req.params.code), (err, token) => {
            if (err){
            res.send(500);
            node.warn(err);
            } else {
            oAuth2Client.setCredentials(token);

            res.end(JSON.stringify(token));
            }
        });
    });
};