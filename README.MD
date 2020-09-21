![npm](https://img.shields.io/npm/v/node-red-contrib-google-oauth-calendar?style=for-the-badge)

# Google Calendar API Nodes for Node-RED
This package contains nodes for accessing googles calendar API. Uses googleapis npm package.

## List upcoming events node
This node lists the next n upcoming events in the given calendar. It also has an inbuilt
refresh mechanism which cyclically pulls the upcoming events. Interval is customizable, if set
to zero, no pulling will happen.