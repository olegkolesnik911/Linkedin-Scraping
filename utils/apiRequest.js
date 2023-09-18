const unirest = require('unirest');

const getLinkedinProfile = (apiKey, email) => {
    return new Promise((resolve, reject) => {

        var req = unirest("GET", "https://api.reversecontact.com/enrichment");
        req.timeout(1000000);
        req.query({
            "apikey": apiKey,
            "mail": email
        });

        req.headers({
            "accept": "application/json",
            "content-type": "application/json"
        });

        req.end(function (res) {
            console.log("===========start==============")
            console.log(res.body);
            console.log("===========end==============")
            resolve(res.body);
        });
    });
};

module.exports = {
    getLinkedinProfile,

};