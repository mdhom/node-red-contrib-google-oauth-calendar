module.exports = function(RED) {
    
    function googleCredentials(config) {
        RED.nodes.createNode(this,config);
        this.name   = config.name;
    }
    
    RED.nodes.registerType("googleCredentials", googleCredentials, {
		credentials: {
			clientId:       { type:"text" },
			clientSecret:   { type:"text" },
			accessToken:    { type:"text" },
		}
	});
    
    function googleApi(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        node.on('input', function(msg) {
            node.send(msg);
        });
    }

    RED.nodes.registerType("googleApi",googleApi);
}