/**
 * Created by nstasinos on 27/10/2014.
 */
var express = require('express');
var fs = require('fs');
var router = express.Router();


//var test = 0;

router.get('/', function (req, res) {

    console.log(req.body);
    //res.header("Access-Control-Allow-Origin", "*");
    var index_swaggerjson  = fs.readFileSync('swagger-json/adv_se_index.json','utf8');
    index_swaggerjson = JSON.parse(index_swaggerjson);
    res.send(index_swaggerjson);

});

router.get('/adv_se', function (req, res) {

    console.log(req.body);
    //res.header("Access-Control-Allow-Origin", "*");
    var index_swaggerjson  = fs.readFileSync('swagger-json/adv_se_audDemographics.json','utf8');
    index_swaggerjson = JSON.parse(index_swaggerjson);
    res.send(index_swaggerjson);

});

module.exports = router;