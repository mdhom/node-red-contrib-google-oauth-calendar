module.exports = function(RED) {
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
};