var log = require('npmlog');
var Client = require('node-rest-client').Client;
var Promise = require('bluebird');

var config = require('./../config');
var configAuth = config.auth;
var configSearch = config.search;

var ENCODING = 'utf8';
var TOKEN_HAS_EXPIRED = 'Invalid token: TokenExpiredError: jwt expired';

log.level = config.log.level;
log.heading = config.log.header;

var LOG_TAG = 'openi.js';
var PAGE_LENGTH = 30;

var params = {
    auth: '',
    authPost: '',
    authURL: configAuth.authURL,
    searchURL: config.openiURL + configSearch.searchURL,
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
        return {
            headers: {
                "Authorization": that.auth
            }
        }
    }
};

module.exports = {
    search: search,
    getAuth: getAuth
};

function search(query, url, idsOnly, previousPageResult) {
    return new Promise(function (resolve, reject) {
        log.verbose(LOG_TAG, 'post the search');
        try {
            var client = new Client();
            var urlAndQuery = formatQuery(query, url, idsOnly);
        } catch (e) {
            return reject(e);
        }
        client.get(urlAndQuery, params.getPostSearchOptions(),
            function (data) {
                try {
                    var dataStr = data.toString(ENCODING);
                    var openiData = JSON.parse(dataStr);
                    if (openiData.error && openiData.error === TOKEN_HAS_EXPIRED) {
                        return resolve(TOKEN_HAS_EXPIRED);
                    }
                    if (previousPageResult) {
                        openiData.result = previousPageResult.concat(openiData.result);
                    }
                    var nextPage = openiData.meta.next;
                    log.verbose(LOG_TAG, 'nextPage: ', nextPage);
                    log.verbose(LOG_TAG, 'total results length: ', openiData.result.length);
                    return nextPage !== null ?
                            resolve(search(query, nextPage, idsOnly, openiData.result)) :
                            resolve(openiData);
                } catch(err) {
                    log.error(LOG_TAG, 'getPostSearchOptions: ', err);
                    return reject(err);
                }
            });
    });
}

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

function formatQuery(query, url, idsOnly) {
    var urlAndQuery = '';
    if (url === null) {
        urlAndQuery = params.searchURL + '?offset=0&limit=' + PAGE_LENGTH;
        if (query[1].indexOf('property_filter=%2C') >= 0) {
            query[1] = query[1].replace("%2C", "");
        }
        if (query[1].indexOf('property_filter=%26') >= 0) {
            query[1] = query[1].replace("%26", "");
        }
        else {
            query[1] = query[1].replace("%26", "%2C");

        }
        urlAndQuery += '&'+ query[1];
        if (idsOnly) {
            urlAndQuery += '&id_only=true';
        }
    } else {
        urlAndQuery = config.openiURL + url;
    }
    //urlAndQuery = urlAndQuery.replace('6personalization_opt_out', 'Cpersonalization_opt_out');
    log.verbose(LOG_TAG, 'urlAndQuery: ', urlAndQuery);
    return urlAndQuery;
}

