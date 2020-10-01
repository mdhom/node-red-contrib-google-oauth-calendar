const {google} = require('googleapis');

function handleError(node, message) {
    node.status({fill:"red", shape:"dot", text:message});
    node.error(message);
}

function handleApiError(node, message) {
    handleError(node, "API Error: " + message);
}

module.exports = { 
    handleError: handleError,
    handleApiError: handleApiError
};