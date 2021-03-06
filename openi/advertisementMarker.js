var config = require('./../config');

var advertisementProto = config.advertisementMarker;

module.exports = function (campaignID, campaignName, campaignBanner, campaignBannerInterstitial) {
    advertisement = getAdvertisement();
    advertisement['@data'].name = campaignName + '_' + campaignID + '_' + getUnixTimeSeconds();
    advertisement['@data'].banner_add = campaignBanner;
    advertisement['@data'].banner_interstitial = campaignBannerInterstitial;
    return advertisement;
};

function getAdvertisement() {
    return advertisementProto;
}

function getUnixTimeSeconds() {
    var now = new Date()
        .getTime()
        .toString()
    now = now.substring(0, now.length - 3);
    return now;
}

