module.exports = {
    mutlipleValuesQuery: mutlipleValuesQuery,
    decodeReq: decodeReq
};

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
                    jsonToQuery = jsonToQuery + "," + mutlipleValuesQuery(obj, audMngArray[obj]);
                } else {
                    jsonToQuery = jsonToQuery + "," + obj + "=" + encodeURIComponent(audMngArray[obj]);
                }
            }
        }
        var optOut = jsonToQuery === '' ? 'personalization_opt_out=no' : ',personalization_opt_out=no'
        return ["OK", "property_filter=" + encodeURIComponent(jsonToQuery + optOut)];
    } catch (e) {
        // An error has occured, handle it, by e.g. logging it
        log.error(LOG_TAG, e);
        return ["Error", e];
        // send resp
    }
}
