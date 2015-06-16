var config = require('./../config');

var advertisementProto = config.advertisementMarker;

module.exports = function (campaignID, campaignName) {
    advertisement = getAdvertisement();
    advertisement['@data'].name = campaignName + '_' + campaignID + '_' + new Date().getTime();
    return advertisement;
};

function getAdvertisement() {
    return advertisementProto;
};

