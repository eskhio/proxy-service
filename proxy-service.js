const conf = require("./conf.js");
const netconf = require("./netconf.js");
const cheerio = require("cheerio");
const fs = require("fs");
const moment = require("moment");

/**
 * @description Proxy service used to fetch usable proxys
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
			testStatus: (_) => {
				const working = `[ ${conf.verbose.printOK(this.proxys.working.length)}`;
				const notworking = ` + ${conf.verbose.printNOK(this.proxys.notworking.length)}`;
				const total = " = " + [
					...this.proxys.notworking,
					...this.proxys.working,
				].length +
					"/" + this.proxys.raw.length + " proxys tested ]";
				return `${working}${notworking}${total}`;
			},
			balanceStatus: (_) => {
				let tasks = 0;
				for (const proxy of this.proxys.working) {
					if (proxy.tasks && proxy.tasks.length > 0) {
						const nbTasks = proxy.tasks.length;
						conf.verbose.logDebug(`${proxy.host}:${proxy.port}`, ":", nbTasks + " tasks");
						tasks += nbTasks;
					}
				}
				conf.verbose.logDebug(`= ${conf.chalk.bold.yellow(tasks)} tasks`);
			},
			taskStatus: (urls) => {
				let idle = 0;
				let working = 0;
				let success = 0;
				let fail = 0;
				for (const proxy of this.proxys.working) {
					if (proxy.tasks) {
						for (const task of proxy.tasks) {
							if (task) {
								if (task.status == "idle") idle++;
								if (task.status == "working") working++;
								if (task.status == "success") success++;
								if (task.status == "fail") fail++;
								// idle += urls;
							}
						}
					}
				}
				// eslint-disable-next-line max-len
				return `[ ${conf.chalk.cyan(("000" + idle).substr(-3))}  |  ${conf.verbose.printMEH(("000" + working).substr(-3))}  |  ${conf.verbose.printOK(("000" + success).substr(-3))}  |  ${conf.verbose.printNOK(("000" + fail).substr(-3))} ]`;
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
	 * @description Test the fetched proxys
	 */
	async testProxys() {
		conf.verbose.displayTitle("Testing");
		const startTime = new moment();
		const endTime = startTime.add(netconf.proxyTestTimeout(), "ms");
		conf.verbose.proxyTestingPB.start(this.proxys, endTime);
		// Testing every proxys against a working HTTP server
		await Promise.all(this.proxys.raw.map(async (proxy) => {
			proxy.testStart = new conf.moment().format();
			await netconf.testProxysRequest(proxy)
			// If success, add it to the working ones
				.then((_) => {
					try {
						proxy.testEnd = new conf.moment().format();
						proxy.success = true;
						proxy.testLatency = conf.moment.duration(new moment(proxy.testEnd).diff(new moment(proxy.testStart))).seconds();
						this.proxys.working.push(proxy);
					} catch (e) {
						conf.errorHandler(e);
					}
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
				conf.verbose.logResult(this.proxys.testStatus());
				if (this.proxys.working.length == 0) {
					conf.verbose.logError("No working proxy found");
					return;
				} else await this.saveProxys();
			});
	}
	/**
	 * @description Parse the fetched proxys
	 * @param {Object} rawProxys Raw proxyw
	 */
	async parseProxys(rawProxys) {
		try {
			// Cheerio is used to parse proxys contained in a table (host: td[0], port: td[2], alive: td[8])
			const $ = cheerio.load(rawProxys);
			for (const possibleProxy of Array.from($(".fpl-list table tr"))) {
				// Current raw proxy
				const https = $(possibleProxy).find("td:nth-child(7)").text();
				const anonymous = $(possibleProxy).find("td:nth-child(5)").text();
				// If it's an HTTPS proxy
				if (https === "yes" && anonymous === "anonymous") {
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
	async saveProxys() {
		conf.verbose.displayTitle("Saving");
		const fileName = "./proxy-" + new conf.moment().format("DDMMYYHHmm") + ".json";
		fs.writeFileSync(fileName, JSON.stringify(this.proxys), {
			flag: "w+",
		});
		conf.verbose.logResult(
			`[ ${fileName} ]`,
		);
	}
}
module.exports = ProxyService;
