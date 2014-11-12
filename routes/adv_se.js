var express = require('express');
var https = require('https');
var router = express.Router();

//var test = 0;

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

function demographics(contextObjs, reqAttr) {
    "use strict";
    var demographJSON = {},
        test =  reqAttr,
        demographAttrName,
        cntxtObjNum,
        j,
        cntxAttrVal;

    for (demographAttrName in test) {      // attribute name in request                                                             // list with available/requested attributes of object
        if (test.hasOwnProperty(demographAttrName)) {
            for (cntxtObjNum = 0; cntxtObjNum < contextObjs.length; cntxtObjNum++) {    // search in every object from the cloudlet search response
                if (typeof test[demographAttrName] === "object") {
                    for (j = 0; j < test[demographAttrName].length; j++) {
                        ////////////////////////////////////////////////////////////////////////////////////////////////////
                        if (contextObjs[cntxtObjNum]['@data'].hasOwnProperty(demographAttrName)) {    //  check if cloudlet context #[cntxtObjNum] has the search property from client req               /*innerObj == cntx*/
                            cntxAttrVal = contextObjs[cntxtObjNum]['@data'][demographAttrName];  // the value of the cloudlet context property
                            // check if this property exists in the demographics (json to be sent)
                            if (test[demographAttrName][j] === cntxAttrVal || test[demographAttrName][j] === "ALL") {   // check if the cloudlet context property value matches the req property value

                                if (demographJSON[demographAttrName] !== undefined && demographJSON[demographAttrName].hasOwnProperty(cntxAttrVal)) {
                                    demographJSON[demographAttrName][cntxAttrVal]++;
                                } else {
                                    if (demographJSON[demographAttrName] !== undefined) {
                                        demographJSON[demographAttrName][cntxAttrVal] = 1;
                                    } else {
                                        demographJSON[demographAttrName] = JSON.parse("{ \"" + cntxAttrVal + "\" : 1}");
                                    }
                                }
                            } else {
                                if (demographJSON[demographAttrName] !== undefined && demographJSON[demographAttrName][test[demographAttrName][j]] === undefined) {
                                    demographJSON[demographAttrName][test[demographAttrName][j]] = 0;
                                } else if (demographJSON[demographAttrName] === undefined) {
                                    demographJSON[demographAttrName] = JSON.parse("{ \"" + test[demographAttrName][j] + "\" : 0}");
                                }

                            }
                        } else {
                            demographJSON[demographAttrName] = JSON.parse("{ \"" + test[demographAttrName][j] + "\" : 0}");
                        }
                    }
                }
            }
        }
    }

    return demographJSON;
}

router.post('/', function (req, res) {
    /*
     *  req:
     *  {
     *       "audMng": {"attr1":[x1,x2,...], "attr2":x3, ...}  <- AND op
     *       demograph: "c,d=xx"
     *  }
     *
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
        path: "/api/v1/search?" + query[1],
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
                    demographicsJSON = demographics(search_res_json, req.body.demographics),
                    res_json = JSON.parse('{"audMng": {"num":' + search_res_json.length + '},"demographics": ' + JSON.stringify(demographicsJSON) + ' }'); // this may has duplicate cloudletids - NOT ANYMORE
                console.log("===== Response JSON =====");
                console.log(res_json);
                res.send(res_json);
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

/*
function buildDemographicsJSON(demographReq, contextObjs) {

    var demographJSON = {};

    for (var cntx in contextObjs[0]['@data']) {
        for (var i = 0; i < contextObjs.length; i++) {
            for (var innerObj in contextObjs[i]['@data']) {
                if (innerObj == cntx) {
                    if (demographJSON.hasOwnProperty(innerObj)) {
                        if (demographJSON[innerObj].hasOwnProperty(contextObjs[i]['@data'][innerObj])) {
                            demographJSON[innerObj][contextObjs[i]['@data'][innerObj]]++;
                            break
                        }
                        else {
                            demographJSON[innerObj][contextObjs[i]['@data'][innerObj]] = 1;
                            break
                        }
                    }
                    else {
                        demographJSON[innerObj] = JSON.parse("{ \"" + contextObjs[i]['@data'][innerObj] + "\" : 1}");
                        break
                    }
                }
            }
        }
    }

    return demographJSON;
}
*/



/*var split = function (str, chr, limit) {
 var parts = str.split(chr);
 var ret = parts.slice(0, limit - 1);

 ret.push(parts.slice(limit - 1).join(chr));
 return ret;
 };*/

module.exports = router;

