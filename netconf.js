const axios = require("axios");
const  CancelToken = axios.CancelToken;
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
			"timeout": netconf.proxyTestTimeout(),
			"baseURL": netconf.proxysTestHost,
		});
	},
	/**
	 * @description Request to fetch some proxys
	 */
	fetchProxysRequest: async () => netconf.proxysBot().get(netconf.proxysEndpoint()),
	/**
	 * @description Request to test the fetched proxys against a known working endpoint
	 * @param {Object} proxy The proxy to test
	 */
	testProxysRequest: async (proxy) => {
		let source = CancelToken.source();
		setTimeout(() => {
			source.cancel();
		}, netconf.proxyTestTimeout());
		return netconf.proxysTestBot().get(
			this.proxysTestEndpoint,
			{cancelToken: source.token, proxy}
		);
	},
};
