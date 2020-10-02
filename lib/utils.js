const {google} = require('googleapis');

function handleError(node, message) {
    node.status({fill:"red", shape:"dot", text:message});
    node.error(message);
}

function handleApiError(node, message) {
    handleError(node, "API Error: " + message);
}

function setRequesting(node) {
    node.status({fill:"yellow", shape:"dot", text:`Requesting...`});
}

function startRefreshTimer(node, config, callback) {
    if (config.refreshInterval > 0) {
        node.context().intervalTimer = setInterval(function () { 
            callback();
        }, config.refreshInterval * 1000);    
    }
}

function stopRefreshTimer(node) {
    clearInterval(node.context().intervalTimer);
}


module.exports = { 
    handleError: handleError,
    handleApiError: handleApiError,
    startRefreshTimer: startRefreshTimer,
    stopRefreshTimer: stopRefreshTimer,
    setRequesting: setRequesting
};