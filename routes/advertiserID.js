/**
 * Created by nstasinos on 4/11/2014.
 */
var express = require('express');
var https = require('https');
var router = express.Router();


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

function mutlipleValuesQuery(name, values) {
    "use strict";
    var tmpStr = "",
        i;
    for (i = 0; i < values.length; i++) {
        if (i === 0) {
            tmpStr = tmpStr + name + "=" + values[i];
        } else {
            tmpStr = tmpStr + "," + name + "=" + values[i];
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
                        jsonToQuery = jsonToQuery + mutlipleValuesQuery(obj, audMngArray[obj]); /*split(audMngArray[obj], ',', audMngArray[obj].length)*/
                    } else {
                        jsonToQuery = jsonToQuery + obj + "=" + audMngArray[obj];
                    }
                } else if (typeof audMngArray[obj] === "object") {
                    jsonToQuery = jsonToQuery + "&" + mutlipleValuesQuery(obj, audMngArray[obj]); /*split(audMngArray[obj], ',', audMngArray[obj].length)*/
                } else {
                    jsonToQuery = jsonToQuery + "&" + obj + "=" + audMngArray[obj];
                }
            }
        }

        return ["OK", "property_filter=" + encodeURIComponent(jsonToQuery + '&personalization_opt_out=no')];

    } catch (e) {
        // An error has occured, handle it, by e.g. logging it
        console.log(e);
        return ["Error", e];
        // send resp
    }
}

function addAdvIDs(cloudletID, id, name, success, error) {
    "use strict";
    //console.log("mpoo" + cloudletIDs);
    var data = {
            "@openi_type": "t_cf1b11a9ef6f4c8a601ad3779c15a485-1102",
            "@data": {
                "id": id,
                "object_type": "openi-advertisment",
                "url": "null",
                "name": name,
                "time": "null",
                "duration": "null",
                "adtype": "null",
                "adnetwork": "null",
                "adservices": "null",
                "applications": "null",
                "criteria": "null"
            }
        },
        path = "/api/v1/objects/" + cloudletID;
    postScript("POST", data, path, null, function () {
        success();
    }, function () {
        error();
    });
}

router.post('/', function (req, res) {
    /*
     *  {
     *      audMng: {},
     *      campain: {"id":"id", "name":"name"}
     *  }
     * */
    "use strict";
    console.log("===== Request JSON =====");
    console.log(req.body);

    var query = decodeReq(req.body),
        openi_req;
    if (query[0] === "Error") {
        res.status(400);
        res.send("Not valid JSON \n" + query[1].message);
    }

    //console.log("===== OPENi search query =====");
    //console.log(decodeURIComponent(query[1]));

    openi_req = https.request({
        host: 'openi-platform.velti.com',
        port: 443,
        path: "/api/v1/search?" + query[1] + "&id_only=true",
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
    }, function (openi_res) {

        console.log("***** OPENi response: " + openi_res.statusCode);

        var body = [];

        openi_res.on('data', function (data) {

            body.push(data);

        }).on('end', function () {
            try {
                var search_res_json = JSON.parse(Buffer.concat(body)),
                    counter1 = 0;
                //demographicsJSON = demographics(search_res_json, req.body.demographics),
                //res_json = JSON.parse('{"audMng": {"num":' + search_res_json.length + '},"demographics": ' + JSON.stringify(demographicsJSON) + ' }'); // this may has duplicate cloudletids - NOT ANYMORE
                console.log("===== Response JSON =====");
                console.log(search_res_json);
                search_res_json.forEach(function (item) {
                    addAdvIDs(item.cloudlet_id, req.body.campain.id, req.body.campain.name, function () {
                        console.log("set success");
                        counter1++;
                        if (counter1 === search_res_json.length) {
                            res.send("All OK");
                        }
                    }, function () {
                        console.log("set failed");
                        //errorIDs.push(search_res_json[i].cloudlet_id);
                        res.status(500);
                        res.send("Failed to add all objects");
                        return false;
                    });
                });
                /*
                for (i = 0; i < search_res_json.length; i++) {
                    addAdvIDs(search_res_json[i].cloudlet_id, req.body.campain.id, req.body.campain.name, function () {
                        console.log("set success");
                        counter1++;
                    }, function () {
                        console.log("set failed");
                        //errorIDs.push(search_res_json[i].cloudlet_id);
                    });
                }
                if (counter1 === search_res_json.length) {
                    res.send("All OK");
                } else {
                    res.send("Some sets failed. Number: " + search_res_json.length - counter1);
                }
                //res.send(res_json);
                */
            } catch (e) {
                console.log("Got error: " + e.message);
                res.status(500);
                res.send("Non-valid JSON received from OPENi \n" + e.message);
            }
        });

    });
    openi_req.end();

    openi_req.on('error', function (e) {

        console.log("Got error: " + e.message);
        res.status(500);
        res.send("Couldn't connect with OPENi \n" + e.message);

    });
});

module.exports = router;