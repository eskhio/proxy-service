
const ProxyService = require("./proxy-service.js");
const conf = require("./conf.js");

(async (_) => {
	const ps = new ProxyService();
	await ps.getProxys();
})().then(function() {
	console.log(conf.verbose.printOK("\n----------------"));
	console.log("Proxy list generated @ "+
		conf.verbose.printOK(new conf.moment().format("hh:mm:ss")),
	);
	console.log(conf.verbose.printOK("----------------\n"));
});
