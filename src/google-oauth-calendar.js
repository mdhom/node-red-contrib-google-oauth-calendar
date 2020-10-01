module.exports = function(RED) {
    const {google} = require('googleapis');
    const utils = require("../lib/utils.js");
        
    function listUpcomingEventsNode(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        if (config.refreshInterval > 0)
        {
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
            utils.authenticate(msg, node, googleCredentials, function(oAuth2Client, node) {
                listUpcomingEvents(
                    oAuth2Client, 
                    node, 
                    config.numEvents, 
                    config.timespan > 0 ? config.timespan : undefined, 
                    function(err, result) {
                    if (err) {
                        node.status({fill:"red",shape:"dot",text:"Error: " + err});
                    } else {
                        msg.googleCredentialsName = googleCredentials.name;
                        msg.payload = result.data.items;
                        node.send(msg);
                        node.status({fill:"green",shape:"dot",text:"Fetched " + result.data.items.length + " events"});
                    }
                });
            });
        }
    }

    RED.nodes.registerType("listUpcomingEvents",listUpcomingEventsNode);

    
    
    function listEventsOnDaysNode(config) {
        RED.nodes.createNode(this,config);
        var googleCredentials = RED.nodes.getNode(config.googleCredentials);
        var node = this;

        try {
            var calenderIds = config.calendarIds == "" ? [] : JSON.parse(config.calendarIds);
        } catch (err) {
            node.error("Fetching calenderIds: " + err);
            var calenderIds = [];
        }
        
        if (config.refreshInterval > 0)
        {
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
            utils.authenticate(msg, node, googleCredentials, function(oAuth2Client, node) {
                listEventsOnDays(
                    oAuth2Client, 
                    node, 
                    calenderIds,
                    config.timezoneOffsetHours,
                    config.daysOffsetStart, 
                    config.daysOffsetEnd, 
                    function(err, result) {
                    if (err) {
                        node.status({fill:"red",shape:"dot",text:"Error: " + err});
                    } else {
                        msg.googleCredentialsName = googleCredentials.name;
                        msg.payload = result;
                        node.send(msg);
                        node.status({fill:"green",shape:"dot",text:"Fetched " + result.length + " events"});
                    }
                });
            });
        }
    }

    RED.nodes.registerType("listEventsOnDays",listEventsOnDaysNode);

    /**
     *                     NODE METHODS
     */
    function listUpcomingEvents(auth, node, numEvents, timespan, callback) {
        const timeMin = (new Date()).toISOString();

        var timeMax = undefined;
        if (timespan !== undefined) {
            timeMax = new Date(Date.now() + timespan * 60 * 60 * 1000).toISOString();
        }

        listEvents(auth, node, undefined, numEvents, timeMin, timeMax, callback);
    }

    function listEventsOnDays(auth, node, calendarIds, timezoneOffsetHours, daysOffsetStart, daysOffsetEnd, callback) {
        var todayMorning = new Date();
        todayMorning.setHours(0,0,0,0);

        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const offsetTimezone = -timezoneOffsetHours * 60 * 60 * 1000;
        const offsetStart = daysOffsetStart * millisecondsPerDay;
        const timeMin = new Date(todayMorning.getTime() - offsetStart + offsetTimezone).toISOString();
        const offsetEnd = daysOffsetEnd * millisecondsPerDay;
        const timeMax = new Date(todayMorning.getTime() + millisecondsPerDay + offsetEnd - 1 + offsetTimezone).toISOString();

        listEvents(auth, node, calendarIds, undefined, timeMin, timeMax, callback);
    }

    /**
     *                     API METHODS
     */
    function listEvents(auth, node, calendarIds, numEvents, timeMin, timeMax, callback) {
        try
        {
            const calendar = google.calendar({version: 'v3', auth});
            const promises = [];
            calendarIds.forEach(calendarId => {
                promises.push(new Promise(resolve => {
                    calendar.events.list({
                        calendarId: calendarId,
                        timeMin: timeMin,
                        timeMax: timeMax,
                        maxResults: numEvents,
                        singleEvents: true,
                        orderBy: 'startTime',
                        }, (err, res) => {
                            res.data.items.forEach(item => {
                                item.calendarId = calendarId;
                            });
                            resolve(res.data.items);
                    });
                }));
            });

            Promise.all(promises).then(result => {
                try {
                    var allItems = [].concat.apply([], result);
                    callback("", allItems);
                } catch(ex) {
                    node.error("Result Exception: " + ex);
                }
            });
        } catch(err) {
            node.error("listEvents: Exception: " + err);
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