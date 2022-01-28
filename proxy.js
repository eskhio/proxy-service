const conf = require("./conf.js");
const netconf = require("./netconf.js");
const cheerio = require("cheerio");
const fs = require("fs");
const moment = require("moment");
const fpl = require("./providers/freeproxylist.conf");
const verbose = require("./verbose.js");
const errors = require("./errors");
/**
 * @description Proxy service used to fetch usable proxys
 */
class Proxy {
  /**
   * Creates an instance of ProxyService.
   * @memberof ProxyService
   */
  constructor({
    host,
    port
  }) {
    this.host = host;
    this.port = port;
    if (!this.host || !this.port) verbose.printNOK("Host/port missing");
    this.createdAt = new moment();
    this.status = "99";
  }
  /*testStatus: (_) => {
    const working = `[ ${conf.verbose.printOK(this.proxys.working.length)}`;
    const notworking = ` + ${conf.verbose.printNOK(this.proxys.notworking.length)}`;
    const total = ` = ${[
      ...this.proxys.notworking,
      ...this.proxys.working,
    ].length}/${this.proxys.raw.length} proxys tested ]`;
    return `${working}${notworking}${total}`;
  },
  balanceStatus: (_) => {
    let tasks = 0;
    for (const proxy of this.proxys.working) {
      if (this.tasks && this.tasks.length > 0) {
        const nbTasks = this.tasks.length;
        console.log(`${this.host}:${this.port}`, ':', `${nbTasks} tasks`);
        tasks += nbTasks;
      }
    }
    console.log(`= ${conf.chalk.bold.yellow(tasks)} tasks`);
  },
  taskStatus: (urls) => {
    let idle = 0;
    let working = 0;
    let success = 0;
    let fail = 0;
    for (const proxy of this.proxys.working) {
      if (this.tasks) {
        for (const task of this.tasks) {
          if (task) {
            if (task.status == 'idle') idle++;
            if (task.status == 'working') working++;
            if (task.status == 'success') success++;
            if (task.status == 'fail') fail++;
            // idle += urls;
          }
        }
      }
    }
    // eslint-disable-next-line max-len
    return `[ ${conf.chalk.cyan((`000${idle}`).substr(-3))}  |  ${conf.verbose.printMEH((`000${working}`).substr(-3))}  |  ${conf.verbose.printOK((`000${success}`).substr(-3))}  |  ${conf.verbose.printNOK((`000${fail}`).substr(-3))} ]`;
  },*/

  /**
   * @description Parse HTTPS proxies
   * @param {Object} rawProxys Raw proxy
   */
  isAnonymous(HTMLEle) {
    return HTMLEle.text() === 'anonymous';
  }
  /**
   * @description Parse anonymous proxies
   * @param {Object} rawProxys Raw proxy
   */
  isHTTPS(HTMLEle) {
    return HTMLEle.text() === 'yes';
  }
  async parseHTMLProxy(rawProxy) {
    return {
      host,
      port
    } = fpl.parse(rawProxy);
  }
  async test(pb) {
    this.testStart = new conf.moment().format();
    return netconf.testProxysRequest(this)
      // If success, add it to the working ones
      .then((_) => {
        this.setStatus({
          time: new conf.moment().format(),
          status: true,
          latency: conf.moment.duration(new moment(this.testEnd).diff(new moment(this.testStart))).seconds()
        });
        pb.update(2000, {
          proxyHost: conf.verbose.printOK(this.host),
          status: conf.verbose.printOK("OK")
        });
        // this.proxys.working.push(this);
        // If fail, add it to the non-working ones and display an error
      }).catch((e) => {
        // this.proxys.notworking.push(this);
        this.setStatus({
          time: new conf.moment().format(),
          status: false,
          latency: conf.moment.duration(new moment(this.testEnd).diff(new moment(this.testStart))).seconds()
        });
        pb.update(2000, {
          status: errors.netErrorHandler(e)
        });
      });
  }
  async setStatus({
    time,
    status,
    latency
  }) {
    this.testEnd = time;
    this.status = status;
    this.testLatency = latency;
  }
  async save() {}
  async parse() {
    return this.parseHTMLProxy();
  }
}
module.exports = Proxy;
