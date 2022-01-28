
const ProxyService = require("./proxy-service.js");
const conf = require("./conf.js");
const fpl = require("./providers/fpl.conf.js");
(async (_) => {
	const ps = new ProxyService(fpl);
	await ps.fetchProxys();
})().then(function() {
	console.log(conf.verbose.printOK("\n----------------"));
	console.log("Proxy list generated @ "+
		conf.verbose.printOK(new conf.moment().format("hh:mm:ss")),
	);
	console.log(conf.verbose.printOK("----------------\n"));
});
