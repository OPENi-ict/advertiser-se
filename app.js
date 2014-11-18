var express = require('express');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');


var adv_se = require('./routes/adv_se');
var advertiserID = require('./routes/advertiserID');
var swagger = require('./routes/swagger');

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
var ad_se_LogStream = fs.createWriteStream(__dirname + '/ad_se.log', {flags: 'a'});

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(logger('dev', {stream: ad_se_LogStream}));
app.use(bodyParser.json());
app.use("/advse-swaggerui", express.static(path.join(__dirname, 'public')));
app.use('/adv_se/advertiserID', advertiserID);
app.use('/adv_se/audDemographics', adv_se.router);
app.use('/advse-swagger', swagger);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    //console.log(req);
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send(err.stack);

        /*res.render('error', {
            message: err.message,
            error: err
        });*/

    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);

    /*res.render('error', {
        message: err.message,
        error: {}
    });*/

});


module.exports = app;
