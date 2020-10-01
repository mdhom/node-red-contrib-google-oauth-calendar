const {google} = require('googleapis');
    
function listEvents(auth, node, calendarIds, numEvents, timeMin, timeMax, callback) {
    try
    {
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
                    if (err) {
                        utils.handleApiError(node, err);
                    } else {
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
                callback("", allItems);
            } catch(err) {
                utils.handleError(node, 'Result exception: '+err);
            }
        });
    } catch(err) {
        utils.handleError(node, 'Exception: '+err);
    }
}

function listCalendars(auth, node, callback) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.calendarList.list({ }, (err, res) => {
        if (res.data !== undefined) {
            const calenders = res.data.items;
            calenders.forEach(c => {
                node.error(c.summary + " | " + c.id);
            });
        }
        callback(err, res);
    });
}

module.exports = { 
    listEvents: listEvents,
    listCalendars: listCalendars
};