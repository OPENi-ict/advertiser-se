module.exports = {
    postObjectToCloudlets: postObjectToCloudlets,
    objectSearch: objectSearch,
    reverseOptOut: reverseOptOut
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
    authPost: '',
    authSession: ''
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
            params.authSession = result.session;
            resolve(result);
        });
    });
}

function getDeveloperAuth(username, password, apiKey, secret) {
    return function (token) {
        return new Promise(function (resolve) {
            log.verbose(LOG_TAG, 'getDeveloperAuth()');
            var url = config.post.authURL;
            var options = {
                data: {
                    "username": username,
                    "password": password,
                    "api_key": apiKey,
                    "secret": secret
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
    };
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
        .then(getDeveloperAuth(configPost.username, configPost.password, configPost.api_key, configPost.secret ))
        .then(function (result) {
            params.authPost = result.session;
            return Promise.resolve(params.authPost);
        });
}

//function objectSearch(personalization_opt_out, page, prevPage) {
//    return getDeveloperSession()
//        .then(function (token) {
//            console.log('token: ', token);
//            return new Promise(function (resolve, reject) {
//                var url = !page ?
//                    'https://demo2.openi-ict.eu:443/api/v1/objects?&order=ascending&offset=0&limit=30&property_filter=personalization_opt_out=' +
//                    personalization_opt_out :
//                    'https://demo2.openi-ict.eu:443' + page;
//                console.log('url: ', url);
//                var options = {
//                    headers: {
//                        "Content-Type": "application/json",
//                        "Authorization": params.authSession
//                    }
//                };
//                var client = new Client();
//                client.get(url, options, function (data) {
//                    try {
//                        var dataStr = data.toString(ENCODING);
//                        var openiData = JSON.parse(dataStr);
//                        if (prevPage) {
//                            openiData.result = prevPage.concat(openiData.result);
//                        }
//                        console.log('next: ', openiData.meta.next);
//                        var next = openiData.meta.next;
//                        return next !== null
//                            ? resolve(objectSearch(personalization_opt_out, next, openiData.result))
//                            : resolve(openiData);
//                    } catch(err) {
//                        log.error(LOG_TAG, 'getPostSearchOptions: ', err);
//                        return reject(err);
//                    }
//                });
//            });
//        });
//}
//
//function reverseOptOut(records, limit) {
//    records.length = limit;
//    var requests = [];
//    records.forEach(function (item, index) {
//        console.log('index: ', index);
//        if (index >= limit) return;
//        var req = new Promise(function (resolve, reject) {
//            var data = item['@data'];
//            if (!data.personalization_opt_out) resolve();
//            data.personalization_opt_out = data.personalization_opt_out === 'yes' ? 'no' : 'yes';
//            var url = 'https://demo2.openi-ict.eu:443/api/v1/objects/' + item['@cloudlet'] + '/' + item['@id'];
//            var options = {
//                headers: {
//                    "Content-Type": "application/json",
//                    "Authorization": params.authSession
//                },
//                data: {
//                    "@id": item['@id'],
//                    "@location": item['@location'],
//                    "@cloudlet": item['@cloudlet'],
//                    "@openi_type": item['@openi_type'],
//                    "@data": data,
//                    "_date_created": item['_date_created'],
//                    "_date_modified": '2015-06-16T11:02:39.774Z',
//                    "_revision": item['_revision']
//                }
//            };
//            log.verbose(LOG_TAG, 'url: ', url);
//            console.log(LOG_TAG, 'options.data: ', options.data);
//            var client = new Client();
//            client.put(url, options, function (result) {
//                try {
//                    var resultStr = result.toString(ENCODING);
//                    var result = JSON.parse(resultStr);
//                    return resolve(result);
//                } catch(err) {
//                    return reject(err);
//                }
//            }, function (err) {
//                reject(err);
//            });
//        });
//        requests.push(req);
//    });
//    return Promise.all(requests);
//}

//function deleteContexts() {
//    return getAuthPost()
//        .then(function () {
//            return new Promise(function (resolve, reject) {
//                console.log('auth session: ', params.authSession);
//                var url =
//                    'https://demo2.openi-ict.eu:443/api/v1/objects?limit=100&type=t_1b9325069fd28e2a173716e760f8fb11-19921&id_only=true&order=ascending';
//                var options = {
//                    headers: {
//                        "Content-Type": "application/json",
//                        "Authorization": params.authSession
//                    }
//                };
//                var client = new Client();
//                client.get(url, options, function (result) {
//                    var result = JSON.parse(result.toString(ENCODING));
//                    console.log('get result: ', result);
//                    resolve(result);
//                });
//            });
//        }).then(function (results) {
//            console.log('got result: ', results);
//            var requests = [];
//            if (results.result.length === 0) {
//                return Promise.resolve(0);
//            }
//            results.result.forEach(function (result) {
//                var request = new Promise(function (resolve) {
//                    var url = 'https://demo2.openi-ict.eu:443/api/v1/objects/' + result['@id'][0] + '/' + result['@id'][1];
//                    var options = {
//                        headers: {
//                            "Content-Type": "application/   json",
//                            "Authorization": params.authPost
//                        }
//                    };
//                    var client = new Client();
//                    client.delete(url, options, function (result) {
//                        var result = JSON.parse(result.toString(ENCODING));
//                        resolve(result);
//                    });
//                });
//                requests.push(request);
//            });
//            console.log('requests.length: ', requests.length);
//            return Promise.all(requests);
//        });
//}
//
//deleteContexts().done(function (results) {
//    console.log('delete results: ', results);
//}, function (err) {
//    console.log('delete err: ', err);
//});