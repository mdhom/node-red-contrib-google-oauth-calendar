module.exports = function(RED) {
    const {google} = require('googleapis');
    const utils = require("../lib/utils.js");
        
    function listTasksNode(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        if (config.refreshInterval > 0) {
            node.context().intervalTimer = setInterval(function () { 
                handleMsg({});
            }, config.refreshInterval * 1000);    
        }

        node.on('input', function(msg) {
            handleMsg(msg);
        });

        node.on('close', function() {
            clearInterval(node.context().intervalTimer);
        });

        function handleMsg(msg) {
            try {
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
    }
    RED.nodes.registerType("list-tasks",listTasksNode);
    
    function listTaskLists(auth, node, numResults, callback) {
        const service = google.tasks({version: 'v1', auth});
        service.tasklists.list(
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