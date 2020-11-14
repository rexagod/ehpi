
/**
 * Used for Gzip stream compression of the response.
 * @external zlib */
const { createGzip:gzip } = require("zlib");
/**
 * Used to access internal HTTP APIs.
 * @external http */
const http = require("http");
/**
 * Used to access internal Socket APIs.
 * @external net */
const net = require("net");
/** 
 * Used to parse host information.
 * @external url */
const url = require("url");
/**
 * Used for caching response stream from the target.
 * @requires stream-cache
 */
const Cache = require("stream-cache");
/**
 * Enable debug logging by passing `DEBUG=ehpi`.
 * @requires debug */
const ehpiConsole = require("debug")("ehpi");

/**
 * @private
 */
let _port;

/**
 * Constructs an ehpi instance.
 * @class
 * @function
 * @param {Object} options - The configuration options for the proxy server.
 */
function ehpi(options) {
	/** @this ehpi */
	options = options || {};
	/** Server's port number. */
	this.port = options.port || 9393;
	/** Server's internal error event handler. */
	this.onServerError = options.onServerError || function() {};
	/** Server's before request event handler. */ 
	this.onBeforeRequest = options.onBeforeRequest || function() {};
	/** Server's before response event handler. */
	this.onBeforeResponse = options.onBeforeResponse || function() {};
	/** Server's request error event handler. */
	this.onRequestError = options.onRequestError || function() {};
}

/**
 * Starts the Proxy Server.
 * @function start
 * @memberof ehpi
 */
ehpi.prototype.start = function() {
    var server = http.createServer();

    server.on("request", this.requestHandler);
    server.on("connect", this.connectHandler);
    server.on("error", this.onServerError);
    server.on("beforeRequest", this.onBeforeRequest);
    server.on("beforeResponse", this.onBeforeResponse);
    server.on("requestError", this.onRequestError);

    server.listen(this.port);
    _port = this.port;
};

/**
 * Server's global request handler.
 * @function requestHandler
 * @memberof ehpi
 * @param {Object} req - The request stream object literal.
 * @param {Object} res - The response stream object literal.
 */
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
        if (requestOptions.host == "127.0.0.1" && requestOptions.port == _port) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end();
            return;
        }
        self.emit("beforeRequest", requestOptions);
        requestRemote(requestOptions, req, res, self);
    } catch (e) {
        ehpiConsole("requestHandlerError" + e.message);
    }
};

/**
 * Initiates request from the Proxy server for the requested resource.
 * @function
 * @param {Object} requestOptions - The host, port, path, method, and header values.
 * @param {Object} req - The request stream object literal. 
 * @param {Object} res - The response stream object literal.
 * @param {Object} proxy - The instantiated ehpi instance.
 */
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
	const cache = new Cache;
	req.pipe(gzip).pipe(cache).pipe(remoteRequest);
	res.on('close', function() {
		remoteRequest.abort();
	});
}

/**
 * Handles SYN operation back to socket after connection is established, else throws.
 * @function connectHandler
 * @memberof ehpi
 * @param {Object} req - The request stream object literal.
 * @param {Object} socket - The socket used for SYN operation.  
 */
ehpi.prototype.connectHandler = function(req, socket) {
    try {
        var self = this;
        var requestOptions = {
            host: req.url.split(':')[0],
            port: req.url.split(':')[1] || 443
        };
        self.emit("beforeRequest", requestOptions);
        connectRemote(requestOptions, socket);
    } catch (e) {
        ehpiConsole("connectHandler error: " + e.message);
    }
};

/**
 * Acknowledges Tunnel errors and attempts to gracefully close the socket, else throw.
 * @function
 * @param {Object} e - The error object literal.
 */
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

/**
 * Attempts to connect to target URI and establish a tunnel.
 * @function
 * @param {Object} requestOptions - The host, port, path, method, and header values. 
 * @param {Object} socket - The socket used for SYN operation. 
 */
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

/**
 * Utility function that writes input to socket.
 * @function
 * @param {Object} socket - The socket used for SYN operation.
 * @param {number} code - The HTTP status code.
 * @param {string} reason - The event that resulted in this SYN operation.
 * @param {Object} headers - The HTTP headers.
 * @param {Object} cb - The error handler callback. 
 */
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
