var express = require('express');
var log = require('npmlog');
var https = require('https');

var search = require('./../openi/openi').search;
var getAuth = require('./../openi/openi').getAuth;
var decodeReq = require('../utils/utils').decodeReq;
var config = require('./../config');

log.level = config.log.level;
log.heading = config.log.header;

var LOG_TAG = 'aadvertiserID.js';
var TOKEN_HAS_EXPIRED = 'Invalid token: TokenExpiredError: jwt expired';

log.info(LOG_TAG, 'adcertiserID.js');

var router = express.Router();

router.post('/', function (req, res) {

    var query = null;
    try {
        log.verbose(LOG_TAG, 'query: ', query);
        query = decodeReq(req.body);
    } catch(err) {
        log.error(LOG_TAG, 'err: ', err);
    }
    if (query === null || query[0] === "Error") {
        res.status(400);
        res.send("Not valid JSON \n" + query[1].message);
        return;
    }

    var idsOnly = true;

    getAuth()
        .then(function () {
            return search(query, idsOnly);
        })
        .then(function(result) {
            return result !== TOKEN_HAS_EXPIRED ?
                Promise.resolve(result) :
                getAuth().then(function () { return search(query, idsOnly); });
        })
        .then(function (openiData) {
            var cloudletIDs = [];
            openiData.forEach(function (item) {
                var cloudletID = item['cloudlet_id'];
                cloudletIDs.push(cloudletID);
            });
            // todo
            console.log('****** cloudletIDs: ', cloudletIDs);
            console.log('****** cloudletIDs.length: ', cloudletIDs.length);
            return Promise.resolve();
        })
        .done(function () {
            res.status(200).json({'result': 'ok'});
        }, function (err) {
            res.status(400).json({'result': 'error: ' + err.message});
        });
});


module.exports = router;