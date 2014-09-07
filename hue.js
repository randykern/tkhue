var http = require('http');
var https = require('https');
var util = require('util');

function getHueIP(ret)
{
    var options = {
        host: 'www.meethue.com',
        path: '/api/nupnp',
    }

    var chunks = ''

    var request = https.request(options, function(response) {
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            chunks = chunks + chunk
        });
        response.on('end', function() {
            try {
                ret(null, JSON.parse(chunks)[0].internalipaddress);
            }
            catch (e) {
                ret(e);
            }
        });
    });

    request.on('error', function(e) {
        ret(e);
    });

    request.end();
}

function createUserInner(attempt, bridgeIP, devicetype, username, ret)
{
    var options = {
        host: bridgeIP,
        path: '/api',
        method: 'POST',
    }

    var body = {
        devicetype: devicetype,
    }

    if (username) {
        body.username = username;
    }

    var chunks = ''
    var request = http.request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
            chunks = chunks + chunk
        });

        response.on('end', function() {
            try {
                ret(null, attempt, JSON.parse(chunks));
            }
            catch (e) {
                ret(e);
            }
        });
    });

    request.on('error', function(e) {
        ret(e);
    });

    request.write(JSON.stringify(body));

    request.end();
}

function createUser(bridgeIP, devicetype, username, ret)
{
    var MAXATTEMPTS = 30;

    function retry(err, attempt, result) {
        if (err) {
            ret(err);
        }
        else {
            console.log(util.inspect(result[0], { showHiden: true, depth: null }));

            if (result[0].error) {
                if (result[0].error.type === 101) {
                    if (attempt === MAXATTEMPTS) {
                        ret(result[0].error);
                        return;
                    }

                    if (attempt === 0) {
                        console.log('Please press the link button on the Hue bridge...');
                    }

                    setTimeout(function() {
                        createUserInner(attempt + 1, bridgeIP, devicetype, username, retry);

                    }, 1000);
                }
                else {
                    ret(result[0].error);
                }
            }
            else {
                ret(null, result);
            }
        }
    }

    createUserInner(0, bridgeIP, devicetype, username, retry);
}



getHueIP(function(err, ip) {
    if (err) {
        console.log('ERROR: ' + err);
        return;
    }

    createUser(ip, 'tkhue', '3c3b79b41b2987ef10d80fdc396a5557', function(err, response) {
        if (err) {
            console.log('ERROR: ' + JSON.stringify(err));
        }
        else {
            console.log(util.inspect(response, { showHiden: true, depth: null }));
        }
    });
});


