const {google} = require('googleapis');
const api = require('./api.js')

function listTaskLists(credentials, numResults, callback) {
    try
    {
        api.authenticate(credentials, function(err, auth) {
            if (err) {
                callback(err, undefined);
            } else {
                const options = {
                    maxResults: numResults,
                };
                google.tasks({version: 'v1', auth}).tasklists.list(options, (err, res) => {
                    if (err) {
                        callback("API Error: "+err, undefined);
                    } else {
                        callback(undefined, res.data.items);
                    }
                });
            }
        });
    } catch (err) {
        callback("list tasklist exception: "+err, undefined);
    }
}

module.exports = { 
    listTaskLists: listTaskLists
};