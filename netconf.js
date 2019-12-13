const axios = require("axios");
const conf = require("./conf.js");

const netconf = module.exports = {
	proxyHost: () => (conf.test() ? "http://localhost:3000" : "https://free-proxy-list.net"),
	proxySourceTimeout: 5000,
	proxyTestTimeout: (_) => netconf.ptt() || 40000,
	proxyRequestTimeout: (_) => netconf.prt() || 20000,
	proxysEndpoint: (_) => (conf.test() ? "/proxys" : "/"),
	/**
	 * @description Invoke an axios instance used to fetch proxy servers from a source
	 * @return {Object} An axios instance
	 */
	proxysBot: () => {
		return axios.create({
			"baseURL": netconf.proxyHost(),
			"timeout": netconf.proxySourceTimeout,
		});
	},
	/**
	 * @description Test argument to hit a debug env
	 * @return {Boolean} True or false
	 */
	test: () => {
		for (const arg of process.argv) {
			if (/-test/.test(arg)) {
				return /-test/.test(arg);
			}
		}
	},
	/**
	 * @description Test argument to hit a debug env
	 * @return {Boolean} True or false
	 */
	prt: () => {
		for (const arg of process.argv) {
			if (/-prt/.test(arg)) {
				return arg.match(/=(.*)/)[1];
			}
		}
	},
	/**
	 * @description Test argument to hit a debug env
	 * @return {Boolean} True or false
	 */
	ptt: () => {
		for (const arg of process.argv) {
			if (/-ptt/.test(arg)) {
				return arg.match(/=(.*)/)[1];
			}
		}
	},
	// Is it ever down?
	proxysTestHost: "https://www.lefigaro.fr",
	proxysTestEndpoint: "/",
	/**
	 * @description Invoke an axios instance used to test the fetched proxys
	 * @return {Object} An axios instance
	 */
	proxysTestBot: () => {
		return axios.create({
			"baseURL": netconf.proxysTestHost,
			"timeout": netconf.proxyTestTimeout(),
		});
	},
	/**
	 * @description Handle net errors
	 * @param {String} error The net error
	 * @param {String} details The error title
	 */
	netErrorHandler: (error, details) => {
		// Error
		let messageDetails = "";
		const messageTitle = ` ${(details || "")}`;
		if (error.response && error.response.data) {
			// The request was made and the server responded with a status code that falls out of the range of 2xx
			if (/squid/.test(error.response.data)) messageDetails += "Squid issue";
			else messageDetails += "Proxy issue";
		} else if (error.request) {
			messageDetails +=
			`${error.code} ${(error.address ? "on " + error.address : "")}: ${error.message ? error.message: ""}`;
		} else {
			// Something happened in setting up the request and triggered an Error
			messageDetails += "Unknown error: " + JSON.stringify(error);
		}
		conf.verbose.logError(`${messageTitle}`, "->", `${messageDetails}`);
	},
	/**
	 * @description Request to fetch some proxys
	 */
	fetchProxysRequest: async () => netconf.proxysBot().get(netconf.proxysEndpoint()),
	/**
	 * @description Request to test the fetched proxys against a known working endpoint
	 * @param {Object} proxy The proxy to test
	 */
	testProxysRequest: async (proxy) => await netconf.proxysTestBot().get(
		this.proxysTestEndpoint,
		{proxy},
	),
};
