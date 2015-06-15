var express = require('express')
    , fs = require('fs')
    , path = require('path')
    , favicon = require('serve-favicon')
    , logger = require('morgan')
    , bodyParser = require('body-parser')
    , adv_se = require('./routes/adv_se')
    , advertiserID = require('./routes/advertiserID')
    , postToCloudlets = require('./routes/postToCloudlets')
    , swagger = require('./routes/swagger')
    , app = express()
    , ad_se_LogStream = fs.createWriteStream(__dirname + '/ad_se.log', {flags: 'a'})

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    next()
})

app.use(logger('dev', {stream: ad_se_LogStream}))
app.use(bodyParser.json())
app.use("/advse-swaggerui", express.static(path.join(__dirname, 'public')))
app.use('/adv_se/advertiserID', advertiserID)
app.use('/adv_se/audDemographics', adv_se.router)
app.use('/adv_se/postToCloudlets', postToCloudlets.router)
app.use('/advse-swagger', swagger)

app.use(function(req, res, next) {
    // catch 404 and forward to error handler
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'dev_local') {
    // send stack traces
    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.send(err.stack)
    })
} else {
    // send err messages
    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.send(err.message)
    })
}

module.exports = app
