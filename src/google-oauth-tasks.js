module.exports = function(RED) {
    const {google} = require('googleapis');
    const utils = require("../lib/utils.js");
        
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
                    googleCredentials.authenticate(node, function(oAuth2Client) {
                        listTaskLists(oAuth2Client, node, config.numTasks, function(taskLists) {
                            msg = googleCredentials.createGoogleResult("tasklist", taskLists);
                            node.send(msg);
                            node.status({fill:"green", shape:"dot", text:`Fetched ${taskLists.length} task lists`});
                        });
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
    
    function listTaskLists(auth, node, numResults, callback) {
        google.tasks({version: 'v1', auth}).tasklists.list(
        {
            maxResults: numResults,
        }, 
        (err, res) => {
            if (err) {
                utils.handleApiError(node, err);
                return null;
            } else {
                callback(res.data.items);
            }
        });
    }
}