/**
 * Created by nstasinos on 5/11/2014.
 */
var https = require('https');

// login user

// get context object

// change opt_out to yes/no

// -- for # of users



/*var opt = '';
 var numOfOpts = -1;*/

/*
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

if (process.argv.length === 4) {
    var opt = process.argv[2];
    var numOfOpts = process.argv[3];
}
*/

//var client_id = "adv_se";

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
/*
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

*/

function findOptOut(success) {
    "use strict";
    var query = 'property_filter=' + encodeURIComponent('personalization_opt_out=yes') + '&id_only=true',
        openi_req = https.request({
            host: 'openi-platform.velti.com',
            port: 443,
            path: "/api/v1/search?" + query,
            method: 'GET',
            rejectUnauthorized: false
        }, function (openi_res) {

            //console.log("***** OPENi response: " + openi_res.statusCode + " *****");

            var body = [];

            openi_res.on('data', function (data) {

                body.push(data);

            }).on('end', function () {
                try {
                    var search_res_json = JSON.parse(Buffer.concat(body));
                    //console.log("num of opt outs found: " + search_res_json.length);
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
    "use strict";
    var query = 'property_filter=' + encodeURIComponent('personalization_opt_out=no') + '&id_only=true',
        openi_req = https.request({
            host: 'openi-platform.velti.com',
            port: 443,
            path: "/api/v1/search?" + query,
            method: 'GET',
            rejectUnauthorized: false,
            requestCert: false,
            agent: false
        }, function (openi_res) {

            //console.log("***** OPENi response: " + openi_res.statusCode + " *****");

            var body = [];

            openi_res.on('data', function (data) {

                body.push(data);

            }).on('end', function () {
                try {
                    var search_res_json = JSON.parse(Buffer.concat(body));
                    //console.log("num of opt ins found: " + search_res_json.length);
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
    "use strict";
    // An object of options to indicate where to post to
    var obj, options, req,
        post_data = JSON.stringify(postdata),
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        };

    if (typeof addheaders === 'object') {
        for (obj in addheaders) {
            if (addheaders.hasOwnProperty(obj)) {
                headers[obj] = addheaders.obj;
            }
        }
    }

    options = {
        host: 'openi-platform.velti.com',
        port: 443,
        path: path,
        method: method,
        headers: headers,
        rejectUnauthorized: false
    };

    req = https.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
            success(resultObject);
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
    "use strict";
    // An object of options to indicate where to post to
    var post_data = JSON.stringify(postdata), obj, options, req,
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        };

    if (typeof addheaders === 'object') {
        for (obj in addheaders) {
            if (addheaders.hasOwnProperty(obj)) {
                headers[obj] = addheaders.obj;
            }
        }
    }

    options = {
        host: 'openi-platform.velti.com',
        port: 443,
        path: path,
        method: 'GET',
        headers: headers,
        rejectUnauthorized: false,
        requestCert: false,
        agent: false
    };

    req = https.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var resultObject = JSON.parse(responseString);
            success(resultObject);
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
    "use strict";
    if (opt === 'in') {
        findOptOut(function (data) {

            var optOutObjs = data, i;
            for (i = 0; i < numOfOpts; i++) {
                getScript(null, "/api/v1/objects/" + optOutObjs[i].cloudlet_id + "/" + optOutObjs[i].object_id, '', function (objData) {
                    //console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    objData['@data'].personalization_opt_out = 'no';
                    var updateData = {
                        "@openi_type": objData['@openi_type'].replace("https://openi-platform.velti.com/api/v1/types/", ""),
                        "@data": objData['@data']
                    };
                    postScript('PUT', updateData, "/api/v1/objects/" + objData['@cloudlet'] + "/" + objData['@id'] + "/" + objData._revision, null, function () {
                        //console.log(data);
                        //console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    });
                });
            }
            if (i === numOfOpts) {
                success();
            }
        });

    } else if (opt === 'out') {
        findOptIn(function (data) {

            var optInObjs = data, i;
            for (i = 0; i < numOfOpts; i++) {
                getScript(null, "/api/v1/objects/" + optInObjs[i].cloudlet_id + "/" + optInObjs[i].object_id, '', function (objData) {
                    //console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    objData['@data'].personalization_opt_out = 'yes';
                    var updateData = {
                        "@openi_type": objData['@openi_type'].replace("https://openi-platform.velti.com/api/v1/types/", ""),
                        "@data": objData['@data']
                    };
                    postScript('PUT', updateData, "/api/v1/objects/" + objData['@cloudlet'] + "/" + objData['@id'] + "/" + objData._revision, null, function () {
                        //console.log(data);
                        //console.log(objData['@id'] + ": " + objData['@data']['personalization_opt_out']);
                    });
                });
            }
            if (i === numOfOpts) {
                success();
            }
        });

    }
}

module.exports = {optInOut: optInOut, postScript: postScript};