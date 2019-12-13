const axios = require("axios");
const conf = require("./conf.js");
const netconf = module.exports = {
	proxyHost: () => (conf.test() ? "http://localhost:3000" : "https://free-proxy-list.net"),
	proxysEndpoint: (conf.test() ? "/proxys" : "/"),
	/**
	 * @description Invoke an axios instance used to fetch proxy servers from a source
	 * @return {Object} An axios instance
	 */
	proxysBot: () => {
		return axios.create({
			"baseURL": netconf.proxyHost(),
			"timeout": (conf.test() ? 2000 : 20000),
		});
	},
	// Is it ever down?
	proxysTestHost: "https://www.google.fr",
	proxysTestEndpoint: "/",
	/**
	 * @description Invoke an axios instance used to test the fetched proxys
	 * @return {Object} An axios instance
	 */
	proxysTestBot: () => {
		return axios.create({
			"baseURL": netconf.proxysTestHost,
			"timeout": (conf.test() ? 2000 : 20000),
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
	fetchProxysRequest: async () => netconf.proxysBot().get(netconf.proxysEndpoint),
	/**
	 * @description Request to test the fetched proxys against a known working endpoint
	 * @param {Object} proxy The proxy to test
	 */
	testProxysRequest: async (proxy) => await netconf.proxysTestBot().get(
		this.proxysTestEndpoint,
		{proxy},
	),
};
