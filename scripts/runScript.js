/**
 * Created by nstasinos on 10/11/2014.
 */
var schedule = require('node-schedule');
//var sleep = require('sleep');
var script = require('./optin_out.js');
//var http = require('http');

var optInOuts = [["in", 1], ["in", 1], ["in", 1], ["in", 1], ["in", 1]];

/*var rule = new schedule.RecurrenceRule();
 rule.second = 5;

 var j = schedule.scheduleJob(rule, function(){
 console.log('The answer to life, the universe, and everything!');
 });*/

var i = -1;
var k = 0;
var interval = setInterval(function () {
    i++;
    console.log("i: "+i);
    if (optInOuts[i] == undefined) {
        clearInterval(interval);
    }
    else {
        script.optInOut(optInOuts[i][0], optInOuts[i][1], function () {
            console.log("Updated :"+ ++k);
            var searchJson = {"audMng":
            {
                "personalization_gender":["Female","Male"]
            },
                "demographics":
                {"personalization_country":["ALL"],
                    "personalization_age_range":["ALL"],
                    "personalization_gender":["ALL"],
                    "personalization_income":["ALL"]
                }
            };

            script.postScript("POST",searchJson,"/adv_se/audDemographics",null,
                function(data){
                    console.log(data)
                }
            )
        })
    }
}, 10000);
