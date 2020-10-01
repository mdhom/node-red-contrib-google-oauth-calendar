const {google} = require('googleapis');
const api = require('./api.js')
    
function listEvents(credentials, calendarIds, numEvents, timeMin, timeMax, callback) {
    try
    {
        api.authenticate(credentials, function(err, auth) {
            if (err) {
                callback(err, undefined);
            } else {
                const calendar = google.calendar({version: 'v3', auth});
                const promises = [];
                calendarIds.forEach(calendarId => {
                    promises.push(new Promise(resolve => {
                        const options = {
                            calendarId: calendarId,
                            timeMin: timeMin,
                            timeMax: timeMax,
                            maxResults: numEvents,
                            singleEvents: true,
                            orderBy: 'startTime',
                        };
                        calendar.events.list(options, (err, res) => {
                            if (!err) {
                                res.data.items.forEach(item => {
                                    item.calendarId = calendarId;
                                });
                                resolve(res.data.items);
                            }
                        });
                    }));
                });
        
                Promise.all(promises).then(result => {
                    try {
                        var allItems = [].concat.apply([], result);
                        callback(undefined, allItems);
                    } catch(err) {
                        callback('Result exception: '+err, undefined);
                    }
                });
            }
        });
    } catch(err) {
        callback("listEvents Exception: " + err, undefined);
    }
}

function listCalendars(credentials, callback) {
    try {
        api.authenticate(credentials, function(err, auth) {
            if (err) {
                callback(err, undefined);
            } else {
                const calendar = google.calendar({version: 'v3', auth});
                calendar.calendarList.list({ }, (err, res) => {
                    if (err) {
                        callback("API Error: "+err, undefined);
                    } else if (res.data !== undefined) {
                        callback(undefined, res.data.items);
                    }
                });
            }
        });
    } catch (err) {
        callback("listCalendars Exception: " + err, undefined);
    }
}

module.exports = { 
    listEvents: listEvents,
    listCalendars: listCalendars
};