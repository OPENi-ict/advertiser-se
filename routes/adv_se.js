var express = require('express');
var https = require('https');
var Promise = require('bluebird');
var router = express.Router();
var log = require('npmlog');
var config = require('./../config');
var configAuth = config.auth;
var configSearch = config.search;

log.level = config.log.level;
log.heading = config.log.header;

var Client = require('node-rest-client').Client;
var ENCODING = 'utf8';
var LOG_TAG = 'adv_se';

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
                        log.verbose(LOG_TAG, 'got: ', openiData);
                        var demographicsJSON = tryGetDemographics(openiData.result, demographics);
                        var resJSON = JSON.parse('{"audMng": {"num":' +
                        openiData.meta.total_count +
                        '},"demographics": ' +
                        JSON.stringify(demographicsJSON) + ' }');
                        resolve(resJSON);
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

function tryGetDemographics(contextObjs, reqAttr) {
    getDemographics(contextObjs, reqAttr);
}

function getDemographics(contextObjs, reqAttr) {
    "use strict";
    var demographJSON = {},
        test =  reqAttr,
        demographAttrName,
        cntxtObjNum,
        j,
        cntxAttrVal;
    // attribute name in request
    for (demographAttrName in test) {
        // list with available/requested attributes of object
        if (!test.hasOwnProperty(demographAttrName)) { continue; }
        // search in every object from the cloudlet search response
        for (cntxtObjNum = 0; cntxtObjNum < contextObjs.length; cntxtObjNum++) {
            if (typeof test[demographAttrName] === "object") {
                for (j = 0; j < test[demographAttrName].length; j++) {
                    //  check if cloudlet context #[cntxtObjNum] has the search property from client req
                    if (!contextObjs[cntxtObjNum]['@data'].hasOwnProperty(demographAttrName)) {
                        demographJSON[demographAttrName] = JSON.parse("{ \"" + test[demographAttrName][j] +
                                "\" : 0}");
                        continue;
                    }
                    // the value of the cloudlet context property
                    cntxAttrVal = contextObjs[cntxtObjNum]['@data'][demographAttrName];
                    // check if this property exists in the demographics (json to be sent)
                    if (test[demographAttrName][j] === cntxAttrVal || test[demographAttrName][j] === "ALL") {
                        // check if the cloudlet context property value matches the req property value
                        if (demographJSON[demographAttrName] !== undefined &&
                            demographJSON[demographAttrName].hasOwnProperty(cntxAttrVal)) {
                            demographJSON[demographAttrName][cntxAttrVal]++;
                        } else {
                            if (demographJSON[demographAttrName] !== undefined) {
                                demographJSON[demographAttrName][cntxAttrVal] = 1;
                            } else {
                                demographJSON[demographAttrName] = JSON.parse("{ \"" + cntxAttrVal + "\" : 1}");
                            }
                        }
                    } else {
                        if (demographJSON[demographAttrName] !== undefined &&
                            demographJSON[demographAttrName][test[demographAttrName][j]] === undefined) {
                            demographJSON[demographAttrName][test[demographAttrName][j]] = 0;
                        } else if (demographJSON[demographAttrName] === undefined) {
                            demographJSON[demographAttrName] = JSON.parse("{ \"" + test[demographAttrName][j] +
                            "\" : 0}");
                        }
                    }
                }
            }
        }
    }
    return demographJSON;
}

module.exports = {
    router: router,
    decodeReq: decodeReq,
    mutlipleValuesQuery: mutlipleValuesQuery
};

