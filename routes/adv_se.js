var express = require('express');
var https = require('https');
var Promise = require('bluebird');
var router = express.Router();
var log = require('npmlog');
var config = require('./../config');
var configAuth = config.auth;
var configSearch = config.search;
var demographicsProcessor = require('../utils/demographicsProcessor');

log.level = config.log.level;
log.heading = config.log.header;

var Client = require('node-rest-client').Client;
var ENCODING = 'utf8';
var LOG_TAG = 'adv_se';
var TOKEN_HAS_EXPIRED = 'Invalid token: TokenExpiredError: jwt expired';

log.info(LOG_TAG, 'adv_se.js');

var params = {
    auth: '',
    authURL: configAuth.authURL,
    searchURL: configSearch.searchURL,
    postAuthOptions: {
        data: {
            "username": configAuth.username,
            "password": configAuth.password,
            "scope": ""
        },
        headers:{
            "Content-Type": "application/json"
        }
    },
    getPostSearchOptions: function () {
        var that = this;
        log.verbose(LOG_TAG, 'that auth: ', that.auth);
        return {
            headers: {
                "Authorization": that.auth
            }
        }
    }
};

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
    }
    log.verbose(LOG_TAG, 'body: ', req.body);
    log.verbose(LOG_TAG, 'query: ', query);
    getAuth()
        .then(function () {
            return postTheSearch(query, req.body.demographics);
        })
        .then(function(result) {
            return result !== TOKEN_HAS_EXPIRED ?
                Promise.resolve(result) :
                getAuth().then(function () { return postTheSearch(query, req.body.demographics); });
        })
        .then(function (obj) {
            try {
                var demographicsJSON = demographicsProcessor.getDemographics(obj.openiData.result, obj.demographics);
                var resJSON = JSON.parse('{"audMng": {"num":' +
                    obj.openiData.meta.total_count +
                    '},"demographics": ' +
                    JSON.stringify(demographicsJSON) + ' }');
                return Promise.resolve(resJSON);
            } catch (err) {
                return Promise.reject(err);
            }
        })
        .done(function (result) {
            log.verbose(LOG_TAG, 'done()');
            log.verbose(LOG_TAG, 'result: ', result);
            res.send(result);
        }, function (err) {
            log.error(LOG_TAG, 'done() error');
            log.error(LOG_TAG, 'err: ', err);
            res.send('err: ' + err);
        });
});

function getAuth() {
    return params.auth === '' ? getAuthFromOpeni() : Promise.resolve(params.auth);
}

function getAuthFromOpeni() {
    return new Promise(function (resolve, reject) {
        log.verbose(LOG_TAG, 'gettitng new token');
        try {
            var client = new Client();
            client.post(params.authURL, params.postAuthOptions,
                function (data) {
                    var dataStr = data.toString(ENCODING);
                    var token = JSON.parse(dataStr).session;
                    log.verbose(LOG_TAG, 'dataStr: ', dataStr);
                    params.auth = token;
                    log.verbose(LOG_TAG, 'auth: ', params.auth);
                    resolve();
                }, function (err) {
                    log.error(LOG_TAG, 'post err: ', err);
                    reject(err);
                });
        } catch (e) {
            reject(e);
        }

    });
}

function postTheSearch(query, demographics) {
    return new Promise(function (resolve, reject) {
        log.verbose(LOG_TAG, 'post the search');
        try {
            var client = new Client();
            var urlAndQuery = params.searchURL;
            query[1] = query[1].replace("%26", "%2C"); // ugly and nasty hack todo: correct.
            urlAndQuery += '?'+ query[1];
            client.get(urlAndQuery, params.getPostSearchOptions(),
                function (data) {
                    try {
                        var dataStr = data.toString(ENCODING);
                        var openiData = JSON.parse(dataStr);
                        if (openiData.error && openiData.error === TOKEN_HAS_EXPIRED) {
                            return resolve(TOKEN_HAS_EXPIRED);
                        }
                        return resolve({openiData: openiData, demographics: demographics});
                    } catch(err) {
                        log.error(LOG_TAG, 'getPostSearchOptions: ', err);
                        reject(err);
                    }
                }, function (err) {
                    log.error(LOG_TAG, 'get error: ', err);
                    reject("Couldn't connect with OPENi \n" + err);
                });
        } catch (e) {
            reject(e);
        }
    });
}

function mutlipleValuesQuery(name, values) {
    "use strict";
    var tmpStr = "",
        i;
    for (i = 0; i < values.length; i++) {
        if (i === 0) {
            tmpStr = tmpStr + name + "=" + encodeURIComponent(values[i]);
        } else {
            tmpStr = tmpStr + "," + name + "=" + encodeURIComponent(values[i]);
        }
    }
    return tmpStr;
}

function decodeReq(reqBody) {
    "use strict";
    try {
        var req_json = reqBody,
            audMngArray = req_json.audMng,
            jsonToQuery = "",
            obj;
        for (obj in audMngArray) {
            if (audMngArray.hasOwnProperty(obj)) {
                if (jsonToQuery === "") {
                    if (typeof audMngArray[obj] === "object") {
                        jsonToQuery = jsonToQuery + mutlipleValuesQuery(obj, audMngArray[obj]);
                    } else {
                        jsonToQuery = jsonToQuery + obj + "=" + encodeURIComponent(audMngArray[obj]);
                    }
                } else if (typeof audMngArray[obj] === "object") {
                    jsonToQuery = jsonToQuery + "&" + mutlipleValuesQuery(obj, audMngArray[obj]);
                } else {
                    jsonToQuery = jsonToQuery + "&" + obj + "=" + encodeURIComponent(audMngArray[obj]);
                }
            }
        }
        return ["OK", "property_filter=" + encodeURIComponent(jsonToQuery + '&personalization_opt_out=no')];
    } catch (e) {
        // An error has occured, handle it, by e.g. logging it
        log.error(LOG_TAG, e);
        return ["Error", e];
        // send resp
    }
}

module.exports = {
    router: router,
    decodeReq: decodeReq,
    mutlipleValuesQuery: mutlipleValuesQuery
};

