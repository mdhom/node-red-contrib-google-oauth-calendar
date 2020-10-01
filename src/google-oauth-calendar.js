module.exports = function(RED) {
    const {google} = require('googleapis');
    const utils = require("../lib/utils.js");
        
    function listUpcomingEventsNode(config) {
        try {
            RED.nodes.createNode(this,config);
            var googleCredentials = RED.nodes.getNode(config.googleCredentials);
            var node = this;

            var calendarIds = [];
            try {
                calendarIds = config.calendarIds == "" ? [] : JSON.parse(config.calendarIds);
            } catch (err) {
                utils.handleError(node, 'Fetching calendarIds: ' + err);
            }

            utils.startRefreshTimer(node, config, handleMsg({}));

            node.on('input', () => handleMsg({}));
            node.on('close', () => utils.stopRefreshTimer(node));

            function handleMsg(msg) {
                try {
                    utils.setRequesting(node);
                    googleCredentials.authenticate(node, function(oAuth2Client) {
                        
                        node.status({fill:"yellow",shape:"dot",text:"Authenticated"});
                        const timeMin = (new Date()).toISOString();
                        var timeMax = undefined;
                        if (config.timespan && config.timespan > 0) {
                            timeMax = new Date(Date.now() + config.timespan * 60 * 60 * 1000).toISOString();
                        }

                        listEvents(oAuth2Client, node, calendarIds, config.numEvents, timeMin, timeMax, function(err, result) {
                            node.status({fill:"yellow",shape:"dot",text:"Result"});
                            if (err) {
                                utils.handleApiError(node, err);
                            } else {
                                msg = googleCredentials.createGoogleResult("eventslist", result);
                                node.send(msg);
                                node.status({fill:"green",shape:"dot",text:"Fetched " + result.length + " events"});
                            }
                        });
                    });
                } catch(err) {
                    utils.handleError(node, "Exception: " + err);
                }
            }
        } catch (err) {
            utils.handleError(this, "Base exception: " + err);
        }
    }
    RED.nodes.registerType("listUpcomingEvents",listUpcomingEventsNode);
    
    function listEventsOnDaysNode(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        var calendarIds = [];
        try {
            calendarIds = config.calendarIds == "" ? [] : JSON.parse(config.calendarIds);
        } catch (err) {
            utils.handleError(node, 'Fetching calendarIds: ' + err);
        }
        
        utils.startRefreshTimer(node, config, handleMsg({}));

        node.on('input', () => handleMsg({}));
        node.on('close', () => utils.stopRefreshTimer(node));

        function handleMsg(msg) {
            utils.setRequesting(node);
            googleCredentials.authenticate(node, function(oAuth2Client) {
                var todayMorning = new Date();
                todayMorning.setHours(0,0,0,0);

                const millisecondsPerDay = 24 * 60 * 60 * 1000;
                const offsetTimezone = -config.timezoneOffsetHours * 60 * 60 * 1000;
                const offsetStart = config.daysOffsetStart * millisecondsPerDay;
                const timeMin = new Date(todayMorning.getTime() - offsetStart + offsetTimezone).toISOString();
                const offsetEnd = config.daysOffsetEnd * millisecondsPerDay;
                const timeMax = new Date(todayMorning.getTime() + millisecondsPerDay + offsetEnd - 1 + offsetTimezone).toISOString();

                listEvents(oAuth2Client, node, calendarIds, undefined, timeMin, timeMax, function(err, result) {
                    if (err) {
                        utils.handleError(node, err);
                    } else {
                        msg = googleCredentials.createGoogleResult("eventslist", result);
                        node.send(msg);
                        node.status({fill:"green",shape:"dot",text:"Fetched " + result.length + " events"});
                    }
                });
            });
        }
    }
    RED.nodes.registerType("listEventsOnDays",listEventsOnDaysNode);

    
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
}