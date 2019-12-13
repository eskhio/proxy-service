const conf = require("./conf.js");
const netconf = require("./netconf.js");
const cheerio = require("cheerio");
const fs = require("fs");

/**
 * @description
 * @class ProxyService
 */
class ProxyService {
	/**
	 * Creates an instance of ProxyService.
	 * @memberof ProxyService
	 */
	constructor() {
		this.test = true;
		this.proxys = {
			raw: [],
			working: [],
			notworking: [],
			status: (_) => {
				const working = `[ ${conf.verbose.printOK(this.proxys.working.length)}`;
				const notworking = ` + ${conf.verbose.printNOK(this.proxys.notworking.length)}`;
				const total = " = "+
				[
					...this.proxys.notworking,
					...this.proxys.working,
				].length +
				"/"+this.proxys.raw.length+" proxys tested ]";
				return `${working}${notworking}${total}`;
			},
		};
	}
	/**
	 * @description Fetch some proxy servers
	 */
	async getProxys() {
		conf.verbose.displayTitle("Fetching");
		const proxys = await netconf.fetchProxysRequest();
		this.parseProxys(proxys.data);
		conf.verbose.logResult(`[ +${conf.verbose.printOK(this.proxys.raw.length)} proxys ]`);
		await this.testProxys();
	}
	/**
	 * @description Parse the fetched proxys
	 * @param {Object} rawProxys Raw proxyw
	 */
	async parseProxys(rawProxys) {
		try {
			// Cheerio is used to parse proxys contained in a table (host: td[0], port: td[2], alive: td[8])
			const $ = cheerio.load(rawProxys);
			for (const possibleProxy of Array.from($("#proxylisttable tbody tr"))) {
				// Current raw proxy
				const https = $(possibleProxy).find("td:nth-child(7)").text();
				// If it's an HTTPS proxy
				if (https == "yes") {
					const proxy = {
						host: $(possibleProxy).find("td:first-child").text(),
						port: $(possibleProxy).find("td:nth-child(2)").text(),
						alive: $(possibleProxy).find("td:nth-child(8)").text(),
					};
					conf.verbose.logDebug("Proxy added", `${proxy.host}:${proxy.port}`, `@${proxy.alive}`);
					this.proxys.raw.push(proxy);
				}
			}
		} catch (e) {
			conf.errorHandler(e, "Parsing error");
		}
	}
	/**
	 * @description Test the fetched proxys
	 */
	async testProxys() {
		conf.verbose.displayTitle("Testing");
		conf.verbose.proxyTestingPB.start(this.proxys);
		// Testing every proxys against a working HTTP server
		await Promise.all(this.proxys.raw.map(async (proxy) => {
			return netconf.testProxysRequest(proxy)
			// If success, add it to the working ones
				.then((_) => {
					proxy.lastchecked = new conf.moment().format("DDMMYYHHmm");
					this.proxys.working.push(proxy);
					proxy.success = true;
					// If fail, add it to the non-working ones and display an error
				}).catch((e) => {
					this.proxys.notworking.push(proxy);
					proxy.success = false;
					netconf.netErrorHandler(e, proxy.host + ":" + proxy.port);
				});
		}))
			// Once tested, display a report
			.then(async (_) => {
				conf.verbose.proxyTestingPB.stop();
				conf.verbose.logResult(this.proxys.status());
				this.saveProxys();
			});
	}
	/**
	 * @description Test the fetched proxys
	 */
	async saveProxys() {
		conf.verbose.displayTitle("Saving");
		const fileName = "./proxy-" + new conf.moment().format("DDMMYYHHmm") + ".json";
		fs.writeFileSync(fileName, JSON.stringify(this.proxys), {flag: "w+"});
		conf.verbose.logResult(
			`[ -> ${fileName} ]`,
		);
	}
}
module.exports = ProxyService;
