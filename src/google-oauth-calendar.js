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
    
    function listUpcomingEventsNode(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        if (config.refreshInterval > 0)
        {
            setInterval(function () { 
                handleMsg({});
            }, config.refreshInterval * 1000);    
        }

        node.on('input', function(msg) {
            handleMsg(msg);
        });

        function handleMsg(msg) {
            prepareApiRequest(msg, node, googleCredentials, function(oAuth2Client, node) {
                listUpcomingEvents(oAuth2Client, node, config.numEvents, function(err, result) {
                    if (err) {
                        node.status({fill:"red",shape:"dot",text:"Error: " + err});
                    } else {
                        msg.googleCredentialsName = googleCredentials.name;
                        msg.payload = result.data.items;
                        node.send(msg);
                        node.status({fill:"green",shape:"dot",text:"Fetched " + result.data.items.length + " events"});
                    }
                });
            });
        }
    }

    RED.nodes.registerType("listUpcomingEvents",listUpcomingEventsNode);

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function listUpcomingEvents(auth, node, numEvents, callback) {
        const calendar = google.calendar({version: 'v3', auth});
            calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: numEvents,
            singleEvents: true,
            orderBy: 'startTime',
            }, (err, res) => {
                callback(err, res);
            });
    }

    // API WRAPPERS

    function prepareApiRequest(msg, node, googleCredentials, callback) {
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
}