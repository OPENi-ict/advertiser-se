/**
 * Created by nstasinos on 5/11/2014.
 */

// login user

// get context object

// change opt_out to yes/no

// -- for # of users

https = require('https');

/*var opt = '';
 var numOfOpts = -1;*/

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

if (process.argv.length === 4) {
    var opt = process.argv[2];
    var numOfOpts = process.argv[3];
}

var client_id = "adv_se";
/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function startScript() {
}

function loginUsers(username, password) {
    var postJson = {
        "name": username,
        "password": password
    };

    postScript('POST', postJson, '/uaa/session',
        function (data) {

            var postJson = {
                "session": data.session,
                "client_id": client_id
            };

            postScript('POST', postJson, '/uaa/authorize',
                function (data) {

                    postScript('POST', null, '/api/v1/cloudlets', {'Authorization': data.token},
                        function (data) {

                        }
                    )
                }
            )
        }
    )
}

function findOptOut(success) {

    var query = 'property_filter=' + encodeURIComponent('personalization_opt_out=yes') + '&id_only=true';

    var openi_req = https.request({
            host: 'openi-platform.velti.com',
            port: 443,
            path: "/api/v1/search?" + query,
            method: 'GET',
            rejectUnauthorized: false
        },
        function (openi_res) {

            console.log("***** OPENi response: " + openi_res.statusCode + " *****");

            var body = [];

            openi_res.on('data', function (data) {

                body.push(data);

            }).on('end', function () {
                try {
                    var search_res_json = JSON.parse(Buffer.concat(body));
                    console.log("num of opt outs found: " + search_res_json.length);
                    success(search_res_json);
                } catch (e) {
                    console.log("Got error: " + e.message);
                }
            });

        });
    openi_req.end();

    openi_req.on('error', function (e) {

        console.log("Got error: " + e.message);

    });
}

function findOptIn(success) {

    var query = 'property_filter=' + encodeURIComponent('personalization_opt_out=no') + '&id_only=true';

    var openi_req = https.request({
            host: 'openi-platform.velti.com',
            port: 443,
            path: "/api/v1/search?" + query,
            method: 'GET',
            rejectUnauthorized: false,
            requestCert: false,
            agent: false
        },
        function (openi_res) {

            console.log("***** OPENi response: " + openi_res.statusCode + " *****");

            var body = [];

            openi_res.on('data', function (data) {

                body.push(data);

            }).on('end', function () {
                try {
                    search_res_json = JSON.parse(Buffer.concat(body));
                    console.log("num of opt ins found: " + search_res_json.length);
                    success(search_res_json);
                } catch (e) {
                    console.log("Got error: " + e.message);
                }
            });

        });
    openi_req.end();

    openi_req.on('error', function (e) {

        console.log("Got error: " + e.message);

    });
}

function postScript(method, postdata, path, addheaders, success, error) {

    // An object of options to indicate where to post to
    var post_data = postdata;

    post_data = JSON.stringify(post_data);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(post_data)
    };

    if (typeof addheaders === 'object') {
        for (var obj in addheaders) {
            headers[obj] = addheaders.obj;
        }
    }

    var options = {
        host: 'openi-platform.velti.com',
        port: 443,
        path: path,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
            success(resultObject)
        });
    });

    req.on('error', function (e) {
        console.log("Error :\n" + e);
        error(e);
    });

    req.write(post_data);
    req.end();

}

function getScript(postdata, path, addheaders, success, error) {

    // An object of options to indicate where to post to
    var post_data = postdata;

    post_data = JSON.stringify(post_data);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    };

    if (typeof addheaders === 'object') {
        for (var obj in addheaders) {
            headers[obj] = addheaders.obj;
        }
    }

    var options = {
        host: 'openi-platform.velti.com',
        port: 443,
        path: path,
        method: 'GET',
        headers: headers,
        rejectUnauthorized: false,
        requestCert: false,
        agent: false
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
            success(resultObject)
        });
    });

    req.on('error', function (e) {
        console.log("Error :\n" + e);
        error(e);
    });

    req.write(post_data);
    req.end();

}

function optInOut(opt, numOfOpts, success) {
    if (opt === 'in') {
        findOptOut(function (data) {

            var optOutObjs = data;
            for (var i = 0; i < numOfOpts; i++) {
                getScript(null, "/api/v1/objects/" + optOutObjs[i]['cloudlet_id'] + "/" + optOutObjs[i]['object_id'], '', function (objData) {
                    console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    objData['@data']['personalization_opt_out'] = 'no';
                    var updateData = {
                        "@openi_type": objData['@openi_type'].replace("https://openi-platform.velti.com/api/v1/types/", ""),
                        "@data": objData['@data']
                    };
                    postScript('PUT', updateData, "/api/v1/objects/" + objData['@cloudlet'] + "/" + objData['@id'] + "/" + objData._revision, null, function () {
                        //console.log(data);
                        console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                        success();
                    })
                })
            }

        });

    }
    else if (opt === 'out') {
        findOptIn(function (data) {

            var optInObjs = data;
            for (var i = 0; i < numOfOpts; i++) {
                getScript(null, "/api/v1/objects/" + optInObjs[i]['cloudlet_id'] + "/" + optInObjs[i]['object_id'], '', function (objData) {
                    console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    objData['@data']['personalization_opt_out'] = 'yes';
                    var updateData = {
                        "@openi_type": objData['@openi_type'].replace("https://openi-platform.velti.com/api/v1/types/", ""),
                        "@data": objData['@data']
                    };
                    postScript('PUT', updateData, "/api/v1/objects/" + objData['@cloudlet'] + "/" + objData['@id'] + "/" + objData._revision, null, function () {
                        //console.log(data);
                        console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                        success();
                    })
                })
            }
        });

    }
}

//loginUsers("adv1","adv1");

//optInOut('out',2);

module.exports = {optInOut: optInOut, postScript: postScript};