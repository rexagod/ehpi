const http = require("http");
const net = require("net");
const url = require("url");
const ehpiConsole = require("debug")("ehpi");


let port;

function ehpi(options) {
    this.port = options.port || 9393;
    this.onServerError = options.onServerError || function() {};
    this.onBeforeRequest = options.onBeforeRequest || function() {};
    this.onBeforeResponse = options.onBeforeResponse || function() {};
    this.onRequestError = options.onRequestError || function() {};
}

ehpi.prototype.start = function() {
    var server = http.createServer();

    server.on("request", this.requestHandler);
    server.on("connect", this.connectHandler);
    server.on("error", this.onServerError);
    server.on("beforeRequest", this.onBeforeRequest);
    server.on("beforeResponse", this.onBeforeResponse);
    server.on("requestError", this.onRequestError);

    server.listen(this.port);
    port = this.port;
}

ehpi.prototype.requestHandler = function(req, res) {
    try {
        var self = this;
        var path = req.headers.path || url.parse(req.url).path;
        var requestOptions = {
            host: req.headers.host.split(':')[0],
            port: req.headers.host.split(':')[1] || 80,
            path: path,
            method: req.method,
            headers: req.headers
        };
        if (requestOptions.host == "127.0.0.1" && requestOptions.port == port) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end();
            return;
        }
        self.emit("beforeRequest", requestOptions);
        requestRemote(requestOptions, req, res, self);
    } catch (e) {
        ehpiConsole("requestHandlerError" + e.message);
    }
    
    function requestRemote(requestOptions, req, res, proxy) {
        var remoteRequest = http.request(requestOptions, function(remoteResponse) {
            remoteResponse.headers['proxy-agent'] = 'ehpi v0.1.0';
            res.writeHead(remoteResponse.statusCode, '', remoteResponse.headers);
            proxy.emit("beforeResponse", remoteResponse);
            remoteResponse.pipe(res);
            // res.pipe(remoteResponse);
        });
        remoteRequest.on('error', function(e) {
            proxy.emit("requestError", e, req, res);
            res.writeHead(502, 'Proxy fetch failed');
		    // res.end();
			// remoteRequest.end();
        });
        req.pipe(remoteRequest);
        res.on('close', function() {
            remoteRequest.abort();
        });
    }
}

ehpi.prototype.connectHandler = function(req, socket, head) {
    try {
        var self = this;
        var requestOptions = {
            host: req.url.split(':')[0],
            port: req.url.split(':')[1] || 443
        };
        self.emit("beforeRequest", requestOptions);
        connectRemote(requestOptions, socket);
        function ontargeterror(e) {
            ehpiConsole(req.url + " Tunnel error: " + e);
            _synReply(socket, 502, "Tunnel error", {}, function() {
                try {
                    socket.end();
                }
                catch(e) {
                    ehpiConsole('end error' + e.message);
                }
            });
        }

        function connectRemote(requestOptions, socket) {
            var tunnel = net.createConnection(requestOptions, function() {
                _synReply(socket, 200, 'Connection established', {
                        'Connection': 'keep-alive',
                        'Proxy-Agent': 'ehpi v0.1.0'
                    },
                    function(error) {
                        if (error) {
                            ehpiConsole("syn error", error.message);
                            tunnel.end();
                            socket.end();
                            return;
                        }
                        tunnel.pipe(socket);
                        socket.pipe(tunnel);
                    }
                );
            });
            socket.on('error', function(e) {
                ehpiConsole('socket error:', e);
            });
            tunnel.setNoDelay(true);
            tunnel.on('error', ontargeterror);
        }
    } catch (e) {
        ehpiConsole("connectHandler error: " + e.message);
    }
}

function _synReply(socket, code, reason, headers, cb) {
    try {
        const statusLine = 'HTTP/1.1 ' + code + ' ' + reason + '\r\n';
        let headerLines = '';
        for (var key in headers) {
            headerLines += key + ': ' + headers[key] + '\r\n';
        }
        socket.write(statusLine + headerLines + '\r\n', 'UTF-8', cb);
    } catch (error) {
        cb(error);
    }
}

module.exports = ehpi;
