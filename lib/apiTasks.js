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

function listTasks(credentials, tasklists, callback) {
    try
    {
        api.authenticate(credentials, function(err, auth) {
            if (err) {
                callback(err, undefined);
            } else {
                const promises = [];
                tasklists.forEach(tasklist => {
                    promises.push(new Promise((resolve, reject) => {
                        const options = {
                            tasklist: tasklist.id
                        };
                        console.log("Requesting tasklist: " + tasklist.id);
                        google.tasks({version: 'v1', auth}).tasks.list(options, (err, res) => {
                            if (err) {
                                reject("API Error: "+err);
                            } else {
                                if (res.data.items) {
                                    res.data.items.forEach(item => {
                                        item.tasklistId = tasklist.id;
                                    });
                                    resolve(res.data.items);
                                } else {
                                    resolve([]);
                                }
                            }
                        });
                    }));
                });
        
                Promise.all(promises).then(result => {
                    var allItems = [].concat.apply([], result);
                    callback(undefined, allItems);
                }).catch(err => { 
                    callback(err, undefined);
                });
            }
        });
    } catch (err) {
        callback("list tasklist exception: "+err, undefined);
    }
}

module.exports = { 
    listTasks: listTasks,
    listTaskLists: listTaskLists
};