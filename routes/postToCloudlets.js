var express = require('express');
var log = require('npmlog');

var config = require('./../config');
var postObjectToCloudlets = require('./../openi/writeToCloudlets').postObjectToCloudlets;

var router = express.Router();
var LOG_TAG = 'postToCloudlets.js';

log.level = config.log.level;
log.heading = config.log.header;

router.post('/', function (req, res) {
    try {
        log.verbose('/');
        log.verbose(LOG_TAG, 'postToCloudlets()');
        log.verbose(LOG_TAG, 'typeof req.body.ids: ', typeof req.body.ids);
        if ((typeof req.body.ids !== 'array') && (typeof req.body.ids !== 'object')) {
            res.status(200).json({ error: 'ids are not defined in request' });
            return;
        }
        log.verbose(LOG_TAG, 'req.body.ids: ', req.body.ids);
        var cloudletIDs = req.body.ids;
        var save = req.body.save;
        postObjectToCloudlets(cloudletIDs, save)
            .done(function (results) {
                log.verbose('results: ', results);
                res.status(200).json(results);
            }, function (err) {
                log.error(err);
                res.status(400).json({error: err});
            });
    } catch(err) {
        res.status(400).json({error: err.message});
    }
});

module.exports = {
    router: router
}