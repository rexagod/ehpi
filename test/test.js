const ehpi = require("../index.js");
const myProxy = new ehpi({
	"port": 9393,
	"onBeforeRequest": function(requestOptions) {
		console.log("Proxy request:" + requestOptions.host + (requestOptions.path || ''));
	}
});
myProxy.start();
console.log("Proxy started at http://localhost:9393");
