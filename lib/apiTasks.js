const {google} = require('googleapis');

function listTaskLists(auth, node, numResults, callback) {
    const options = {
        maxResults: numResults,
    };
    google.tasks({version: 'v1', auth}).tasklists.list(options, (err, res) => {
        if (err) {
            utils.handleApiError(node, err);
            return null;
        } else {
            callback(res.data.items);
        }
    });
}

module.exports = { 
    listTaskLists: listTaskLists
};