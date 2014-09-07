var http = require('http');
var https = require('https');
var util = require('util');

function hueRequest(bridgeIP, username, method, api, body, ret) {
    var url = '/api';
    if (username) {
        url = url + '/' + username;
    }
    if (api) {
        url = url + api;
    }

    var options = {
        host: bridgeIP,
        method: method,
        path: url,
    }

    var chunks = ''
    var request = http.request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
            chunks = chunks + chunk
        });

        response.on('end', function() {
            try {
                ret(null, JSON.parse(chunks));
            }
            catch (e) {
                ret(e);
            }
        });
    });

    request.on('error', function(e) {
        ret(e);
    });

    if (body) {
        request.write(JSON.stringify(body));
    }

    request.end();
}

function getHueIP(ret) {
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

function createUser(bridgeIP, devicetype, username, timeout, ret) {
    var body = {
        devicetype: devicetype,
    }

    if (username) {
        body.username = username;
    }

    var retry = function(err, attempt, result) {
        console.log('Attempt ' + attempt.toString());

        if (err) {
            ret(err);
        }
        else {
            console.log(util.inspect(result, { showHiden: true, depth: null }));

            if (result[0].error) {
                if (result[0].error.type === 101) {
                    if (attempt === timeout) {
                        ret(result[0].error);
                        return;
                    }

                    if (attempt === 0) {
                        console.log('Please press the link button on the Hue bridge...');
                    }

                    setTimeout(function() {
                        hueRequest(bridgeIP, null, 'POST', '', body, function(err, result) {
                            retry(err, attempt + 1, result);
                        });

                    }, 1000);
                }
                else {
                    ret(result[0].error);
                }
            }
            else {
                ret(null, result[0]);
            }
        }
    }

    hueRequest(bridgeIP, null, 'POST', '', body, function(err, result) {
        retry(err, 0, result);
    });
}

function getConfiguration(bridgeIP, username, ret) {
    hueRequest(bridgeIP, username, 'GET', '/config', null, ret);
}

function deleteUser(bridgeIP, username, usertodelete, ret) {
    hueRequest(bridgeIP, username, 'DELETE', '/config/whitelist/' + usertodelete, null, ret);
}

function getFullState(bridgeIP, username, ret) {
    hueRequest(bridgeIP, username, 'GET', '', null, ret);
}

function getLights(bridgeIP, username, ret) {
    hueRequest(bridgeIP, username, 'GET', '/lights', null, ret);
}



getHueIP(function(err, ip) {
    if (err) {
        console.log('ERROR: ' + err);
        return;
    }

    //createUser(ip, 'tkhue', '3c3b79b41b2987ef10d80fdc396a5557', 5,
    //getConfiguration(ip, '3c3b79b41b2987ef10d80fdc396a5557',
    //deleteUser(ip, '3c3b79b41b2987ef10d80fdc396a5557', 'ada49f56b77363244d19e44d6d22aa0b',
    //getFullState(ip, '3c3b79b41b2987ef10d80fdc396a5557',
    getLights(ip, '3c3b79b41b2987ef10d80fdc396a5557',
        function(err, response) {
        if (err) {
            console.log('ERROR: ' + JSON.stringify(err));
        }
        else {
            console.log(util.inspect(response, { showHiden: true, depth: null }));
        }
    });

});


