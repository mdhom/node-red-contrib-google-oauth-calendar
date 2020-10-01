module.exports = function(RED) {
    const utils = require("../lib/utils.js");
    const api = require("../lib/apiTasks.js");
        
    function listTasksNode(config) {
        try {
            RED.nodes.createNode(this,config);
            var googleCredentials = RED.nodes.getNode(config.googleCredentials);
            var node = this;

            utils.startRefreshTimer(node, config, handleMsg({}));

            node.on('input', () => handleMsg({}));
            node.on('close', () => utils.stopRefreshTimer(node));

            function handleMsg(msg) {
                try {
                    utils.setRequesting(node);
                    api.listTaskLists(googleCredentials.credentials, config.numTasks, function(err, taskLists) {
                        if (err) {
                            utils.handleError(node, err);
                        } else {
                            msg = googleCredentials.createGoogleResult("tasklist", taskLists);
                            node.send(msg);
                            node.status({fill:"green", shape:"dot", text:`Fetched ${taskLists.length} task lists`});
                        }
                    });
                } catch(err) {
                    utils.handleError(node, 'Exception: ' + err);
                }
            }
        } catch (err) {
            utils.handleError(this, 'Base exception: ' + err);
        }
    }
    RED.nodes.registerType("list-tasks",listTasksNode);
    
}