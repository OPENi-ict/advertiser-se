/**
 * Created by nstasinos on 10/11/2014.
 */
var schedule = require('node-schedule');
//var sleep = require('sleep');
var script = require('./optin_out.js');
//var http = require('http');

var optInOuts = [];

for (var kk = 0; kk<42; kk++){
    if (Math.floor(kk/7) % 2 == 0){
        optInOuts.push(["in",10])
    } else {
        optInOuts.push(["out",10])
    }
 }

var rule = new schedule.RecurrenceRule();
rule.second = 20;

var i = 0;
var k = 0;

 var j = schedule.scheduleJob(rule, function(){
     "use strict";
     i = i + 1;
     console.log("start i: " + i);
     if (optInOuts[i] === undefined) {
         //clearInterval(interval);
     } else {
         script.optInOut(optInOuts[i][0], optInOuts[i][1], function () {
             k = k + 1;
             console.log("Updated :" + k);
             var searchJson = {
                 "audMng": {
                     "personalization_gender": ["Female", "Male"]
                 },
                 "demographics": {}
             };

             script.postScript("POST", searchJson, "/adv_se/audDemographics", null,
                 function (data) {
                     console.log("final i: " + i);
                     console.log(data.audMng.num);
                 });
         });
     }
 });


/*var interval = setInterval(function () {
    "use strict";
    i = i + 1;
    console.log("start i: " + i);
    if (optInOuts[i] === undefined) {
        clearInterval(interval);
    } else {
        script.optInOut(optInOuts[i][0], optInOuts[i][1], function () {
            k = k + 1;
            console.log("Updated :" + k);
            var searchJson = {
                "audMng": {
                    "personalization_gender": ["Female", "Male"]
                },
                "demographics": {}
            };

            script.postScript("POST", searchJson, "/adv_se/audDemographics", null,
                function (data) {
                    console.log("final i: " + i);
                    console.log(data.audMng.num);
                });
        });
    }
}, 10000);*/
