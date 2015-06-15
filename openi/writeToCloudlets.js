module.exports = {
    postObjectToCloudlets: postObjectToCloudlets
};

var log = require('npmlog');
var Client = require('node-rest-client').Client;
var Promise = require('bluebird');

var config = require('./../config');
var configPost = config.post;

var ENCODING = 'utf8';
var TOKEN_HAS_EXPIRED = 'Invalid token: TokenExpiredError: jwt expired';

log.level = config.log.level;
log.heading = config.log.header;

var LOG_TAG = 'writeToCloudlets.js';

var params = {
    authPost: ''
};

function getDeveloperSession() {
    return new Promise(function (resolve) {
        log.verbose(LOG_TAG, 'getDeveloperSession()');
        var url = config.post.sessionURL;
        var options = {
            data: {
                "username": configPost.username,
                "password": configPost.password,
                "scope": ""
            },
            headers:{
                "Content-Type": "application/json"
            }
        };
        var client = new Client();
        client.post(url, options, function (result) {
            var result = JSON.parse(result.toString(ENCODING));
            resolve(result);
        });
    });
}

function getDeveloperAuth(token) {
    return new Promise(function (resolve) {
        log.verbose(LOG_TAG, 'getDeveloperAuth()');
        var url = config.post.authURL;
        var options = {
            data: {
                "username": configPost.username,
                "password": configPost.password,
                "api_key": configPost.api_key,
                "secret": configPost.secret
            },
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.session
            }
        };
        log.verbose(LOG_TAG, 'conf: ', options.data);
        var client = new Client();
        client.post(url, options, function (result) {
            var result = JSON.parse(result.toString(ENCODING));
            log.verbose(LOG_TAG, 'develop auth: ', result);
            resolve(result);
        });
    });
}

function postObjectToCloudlets(cloudletIDs, obj) {
    return new Promise(function (resolve) {
        var allRequests = [];
        getAuthPost().then(function () {
            cloudletIDs.forEach(function (cID) {
                var request = new Promise(function (resolve) {
                    var url = config.post.objectsURL + cID;
                    var options = {
                        data: obj,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": params.authPost
                        }
                    };
                    var client = new Client();
                    client.post(url, options, function (result) {
                        var result = JSON.parse(result.toString(ENCODING));
                        resolve(result);
                    });
                }).then(function (result) {
                    return result !== TOKEN_HAS_EXPIRED ?
                            Promise.resolve(result) :
                            getAuth().then(function () {
                                return postObjectToCloudlets(cloudletID, obj);
                            });
                });
                allRequests.push(request);
            });
            Promise.all(allRequests).then(function (results) {
                resolve(results);
            });
        });
    });
}

function getAuthPost() {
    return params.authPost === '' ? getAuthPostFromOpeni() : Promise.resolve(params.authPost);
}

function getAuthPostFromOpeni() {
    log.verbose(LOG_TAG, 'getAuthPostFromOpeni()');
    return getDeveloperSession()
        .then(getDeveloperAuth)
        .then(function (result) {
            params.authPost = result.session;
            return Promise.resolve(params.authPost);
        });
}