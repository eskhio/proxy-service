const conf = require("./conf.js");
const netconf = require("./netconf.js");
const ProxyService = require("./proxy");
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");

/**
 * @description Load balance requests
 * @class LoadBalancer
 */
class LoadBalancer {
	/**
	 * Creates an instance of LoadBalancer
	 * @param {Object} proxys Proxy to balance the URLs to
	 * @param {} urls
	 */
	constructor(proxys, urls) {
		this.test = true;
		this.proxys = proxys;
		this.urls = urls;
		this.batchNb = 1;
		this.result = [];
		conf.verbose.displayTitle("Balancing");
		conf.verbose.logDebug("--------");
		conf.verbose.logDebug(conf.chalk.bold.cyan("Load balancing"), conf.chalk.bold.cyan(`${this.urls.length} URLs`))
	}
	/**
	 * @description Delete old failed task in order to re-assign them
	 */
	async cleanBalance() {
		// For every available proxy
		for (let [pI, proxy] of Object.entries(this.proxys.working)) {
			// If it has tasks
			if (proxy.tasks) {
				// For every tasks
				for (let [tI, task] of Object.entries(proxy.tasks)) {
					// If it failed, clean it from here
					if (task.status == "fail") {
						delete this.proxys.working[pI].tasks[tI];
					}
				}
			}
		}
	}
	/**
	 * @description Balance the URLs to load between every available proxys
	 */
	balance(batchNb) {
		try {
			conf.verbose.logDebug("--------");
			conf.verbose.logDebug(conf.chalk.cyan.bold("Batch n°" + batchNb));
			conf.verbose.logDebug("--------");
			// Erase every failed tasks for them to be reassigned
			this.cleanBalance();
			this.handleTasksSetup();
			// For each available proxys
			for (let proxy of this.proxys.working) {
				while (
					// While we do have tasks to assign
					this.urls.length > 0 
					// While the server is not overloaded
					&& proxy.tasks.length < proxy.limit) 
				{
					// Task to execute
					proxy.tasks.push({
						url: this.urls.pop(),
						status: "idle"
					});
				}
			}
		} catch(e) { conf.verbose.logError(e)}
		this.proxys.balanceStatus()
	}
	/**
	 * @description Limit that the server is available to handle
	 * @param {int} index Position of this server in the list (first == faster)
	 * @param {int} nbEle Number of tasks
	 * @returns {int} The max requests a server can handle
	 */
	serverLimit(index, nbEle){
		if(index==0) index=1;
		return Math.round(((nbEle / 2) + index)/ 8 )
	}
	/**
	 * @description Fetch the data behind the balanced proxy
	 */
	async request(batchNb) {
		// Progress bar setting
		let requestStartTime = new moment(), endTime = requestStartTime.add(netconf.proxyRequestTimeout(), "ms");
		conf.verbose.loadBalancePB.start(this.proxys, endTime, this.urls.length);
		return await Promise.all(
			// For every proxys that have tasks to do
			this.proxys.working.filter((availableProxy) => availableProxy.tasks)
			.map(async (usedProxy) => {
				// For every tasks of this proxy
				return await Promise.all(usedProxy.tasks.filter(task => task.status == "idle").map(async (task) => {
					task.status = "working";
					// Request behind the proxy
					await axios.get(task.url, { usedProxy, timeout: netconf.proxyRequestTimeout() })
					// Success
					.then((_) => {
						task.status = "success";
						this.result.push({url: task.url, data:_.data});
					// Fail
					}).catch((e) => {
						task.status = "fail";
						this.handleRequestError(e);
					})
				}))
			}))
			// Once tested, display a report
			.finally(async (_) => {
				this.handleRequestBatchEnd(batchNb, requestStartTime);
			});
	}
	/**
	 * @description Setup for every available proxys the tasks it'll have to execute
	 */
	async handleTasksSetup(){
		for (let [pI, proxy] of Object.entries(this.proxys.working)) {
			// Set the max number of tasks
			proxy.limit = this.serverLimit(Math.abs(pI - this.proxys.working.length), this.urls.length);
			// Create a task list if not already done
			if (!proxy.tasks) proxy.tasks = [];
		}
	}
	/**
	 * @description Handle the end of a batch
	 * @param {int} batchNb The batch number
	 * @param {Date} requestStartTime The batch starting time
	 */
	async handleRequestBatchEnd(batchNb, requestStartTime) {
		conf.verbose.loadBalancePB.stop();
		conf.verbose.logDebug(this.proxys.taskStatus(this.urls.length));
		if (this.urls.length > 0) {
			this.balance(batchNb++);
			await this.request(batchNb);
		} else {
			let dateDiff = moment.duration(requestStartTime.diff(new moment())).seconds();
			let nbTasksDone = this.result.length;
			conf.verbose.logResult(`[ ${conf.verbose.printOK(nbTasksDone)} tasks in ${conf.verbose.printOK(dateDiff)}s ]`);
		}
	}
	/**
	 * @description Handle any proxied request error
	 * @param {Error} e The raised error
	 * @param {Object} proxy The proxy that raised it
	 */
	async handleRequestError(e, proxy) {
		proxy.result.push(e);
		netconf.netErrorHandler(e, proxy.host + ":" + proxy.port);
		this.urls.push(task.url);
	}
}
(async () => {
	let p = new ProxyService();
	await p.getProxys();
	if (p.proxys.working.length == 0) { process.exit(); }
	let file = JSON.parse(fs.readFileSync("./urls.json").toString()).map(_ => _.url);
	file = file.concat(file).concat(file).concat(file);
	let lb = new LoadBalancer(p.proxys, file);
	lb.balance(lb.batchNb++)
	await lb.request(lb.batchNb);
})()
module.exports = LoadBalancer;
