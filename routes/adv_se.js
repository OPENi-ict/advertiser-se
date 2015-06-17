var express = require('express');
var https = require('https');
var Promise = require('bluebird');
var router = express.Router();
var log = require('npmlog');
var config = require('./../config');
var demographicsProcessor = require('../utils/demographicsProcessor');
var search = require('./../openi/openi').search;
var getAuth = require('./../openi/openi').getAuth;
var decodeReq = require('../utils/utils').decodeReq;
var mutlipleValuesQuery = require('../utils/utils').mutlipleValuesQuery;

log.level = config.log.level;
log.heading = config.log.header;

var LOG_TAG = 'adv_se';
var TOKEN_HAS_EXPIRED = 'Invalid token: TokenExpiredError: jwt expired';

log.info(LOG_TAG, 'adv_se.js');

router.post('/', function (req, res) {
    "use strict";

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

    log.verbose(LOG_TAG, 'body: ', req.body);
    log.verbose(LOG_TAG, 'query: ', query);

    var demographics = req.body.demographics;

    getAuth()
        .then(function () { return search(query, null); })
        .then(function(result) {
            return result !== TOKEN_HAS_EXPIRED ?
                Promise.resolve(result) :
                getAuth().then(function () { return search(query, null); });
        })
        .then(function (openiData) {
            try {
                var result = createResult(openiData, demographics);
                return Promise.resolve(result);
            } catch (err) {
                return Promise.reject(err);
            }
        })
        .done(function (result) {
            log.verbose(LOG_TAG, 'done()', result);
            res.send(result);
        }, function (err) {
            log.error(LOG_TAG, 'done() error', err);
            res.send('err: ' + err);
        });

});

function createResult(openiData, demographics) {
    log.verbose(LOG_TAG, 'openiData.result.length: ', openiData.result.length);
    var demographicsJSON = demographicsProcessor.getDemographics(openiData.result, demographics);
    var resJSON = JSON.parse('{"audMng": {"num":' +
            openiData.result.length +
            '},"demographics": ' +
    JSON.stringify(demographicsJSON) + ' }');
    return resJSON;
};

module.exports = {
    router: router,
    decodeReq: decodeReq,
    mutlipleValuesQuery: mutlipleValuesQuery
};

