module.exports = function(RED) {
    const utils = require("../lib/utils.js");
    const api   = require("../lib/apiCalendar.js");
        
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

            utils.startRefreshTimer(node, config, () => handleMsg({}));

            node.on('input', () => handleMsg({}));
            node.on('close', () => utils.stopRefreshTimer(node));

            function handleMsg(msg) {
                try {
                    utils.setRequesting(node);
                    const timeMin = (new Date()).toISOString();
                    var timeMax = undefined;
                    if (config.timespan && config.timespan > 0) {
                        timeMax = new Date(Date.now() + config.timespan * 60 * 60 * 1000).toISOString();
                    }

                    api.listEvents(googleCredentials.credentials, calendarIds, config.numEvents, timeMin, timeMax, function(err, result) {
                        if (err) {
                            utils.handleApiError(node, err);
                        } else {
                            msg = googleCredentials.createGoogleResult("eventslist", result);
                            node.send(msg);
                            node.status({fill:"green",shape:"dot",text:"Fetched " + result.length + " events"});
                        }
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
        
        utils.startRefreshTimer(node, config, () => handleMsg({}));

        node.on('input', () => handleMsg({}));
        node.on('close', () => utils.stopRefreshTimer(node));

        function handleMsg(msg) {
            utils.setRequesting(node);
            var todayMorning = new Date();
            todayMorning.setHours(0,0,0,0);

            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const offsetTimezone = -config.timezoneOffsetHours * 60 * 60 * 1000;
            const offsetStart = config.daysOffsetStart * millisecondsPerDay;
            const timeMin = new Date(todayMorning.getTime() - offsetStart + offsetTimezone).toISOString();
            const offsetEnd = config.daysOffsetEnd * millisecondsPerDay;
            const timeMax = new Date(todayMorning.getTime() + millisecondsPerDay + offsetEnd - 1 + offsetTimezone).toISOString();

            api.listEvents(googleCredentials.credentials, calendarIds, undefined, timeMin, timeMax, function(err, result) {
                if (err) {
                    utils.handleError(node, err);
                } else {
                    msg = googleCredentials.createGoogleResult("eventslist", result);
                    node.send(msg);
                    node.status({fill:"green",shape:"dot",text:"Fetched " + result.length + " events"});
                }
            });
        }
    }
    RED.nodes.registerType("listEventsOnDays",listEventsOnDaysNode);

    RED.httpAdmin.get('/google-calendar/listCalendars/:credentialsNodeId', function(req, res){
        const credentialsNode = RED.nodes.getNode(req.params.credentialsNodeId);
        try {
            api.listCalendars(credentialsNode.credentials, function (err, result) {
                if (err) {
                    res.send(500);
                    credentialsNode.error(err);
                } else {
                    const msgOut = { calendars: [] };
                    result.forEach(calendar => {
                        msgOut.calendars.push({
                            id: calendar.id,
                            name: calendar.summary
                        });
                    });
                    res.end(JSON.stringify(msgOut));
                }
            });
        } catch (err) {
            res.send(500);
            credentialsNode.error(err);
        }
    });
}