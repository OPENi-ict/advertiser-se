#!/usr/bin/env node
var debug = require('debug')('test-nodejs');
var app = require('../app');

var fs = require('fs');
var http = require('http');
var https = require('https');
//var privateKey  = fs.readFileSync('bin/sslcert/server.key', 'utf8');
//var certificate = fs.readFileSync('bin/sslcert/server.crt', 'utf8');

//var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app);

httpServer.listen(7001, function() {
    debug('HTTP Express server listening on port ' + this.address().port);
});

/*httpsServer.listen(7002,function() {
    debug('HTTPS Express server listening on port ' + this.address().port);
});*/

httpServer.on('connection', function(socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(30 * 1000);
    // 30 second timeout. Change this as you see fit.
});

/*httpsServer.on('connection', function(socket) {
    //console.log("A new connection was made by a client.");
    socket.setTimeout(30 * 1000);
    // 30 second timeout. Change this as you see fit.
});*/

//
/*app.set('port', process.env.PORT || 7001);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
*/
