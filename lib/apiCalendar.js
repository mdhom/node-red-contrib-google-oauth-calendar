const {google} = require('googleapis');
const api = require('./api.js')
    
function listEvents(credentials, calendars, numEvents, timeMin, timeMax, callback) {
    try
    {
        api.authenticate(credentials, function(err, auth) {
            if (err) {
                callback(err, undefined);
            } else {
                const service = google.calendar({version: 'v3', auth});
                const promises = [];
                calendars.forEach(calendar => {
                    promises.push(new Promise((resolve, reject) => {
                        const options = {
                            calendarId: calendar.id,
                            timeMin: timeMin,
                            timeMax: timeMax,
                            maxResults: numEvents,
                            singleEvents: true,
                            orderBy: 'startTime',
                        };
                        service.events.list(options, (err, res) => {
                            if (err) {
                                reject("API Error: "+err);
                            } else {
                                res.data.items.forEach(item => {
                                    item.calendarId = calendar.id;
                                });
                                resolve(res.data.items);
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