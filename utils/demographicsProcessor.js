module.exports = {
    getDemographics: getDemographics
};

function getDemographics(contextObjs, reqAttr) {
    var demographics = undefined;
    try { demographics = _getDemographics(contextObjs, reqAttr); }
    catch(err) { demographics = Object.create(null); }
    finally { return demographics; }
}

function _getDemographics(contextObjs, reqAttr) {
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