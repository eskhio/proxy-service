/* eslint-disable new-cap */
const fs = require('fs');
const moment = require('moment');
const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const netconf = require('./netconf');
const conf = require('./conf');
const errors = require('./errors');
const Proxy = require('./proxy');

/**
 * @description Proxy service used to fetch usable proxys
 */
class ProxyService {
  constructor(provider) {
    this.test = true;
    this.provider = provider;
    this.proxys = [];
    this.pb = new cliProgress.SingleBar({
      format: `Global: (${
        conf.verbose.printOK('{working}')}+${
        conf.verbose.printNOK('{notWorking}')})/{total}${
        conf.verbose.printOK(' | {bar} | Timeout: -{timeout}s')}`,
      clearOnComplete: true,
      forceRedraw: true,
      align: 'center',
    }, cliProgress.Presets.rect);
    this.proxysPB = new cliProgress.MultiBar({
      format: `{proxyHost}\t\t{bar}${conf.verbose.printMEH(' {status}')}`,
      hideCursor: false,
      clearOnComplete: true,
    }, cliProgress.Presets.shades_grey);
    this.startTime = new moment();
    this.endTime = new moment().add(netconf.proxyTestTimeout(), 'ms');
  }

  /**
   * @description Fetch some proxys
   */
  async fetchProxys() {
    conf.verbose.displayTitle('Fetching');
    const proxys = await netconf.fetchProxysRequest();
    await this.parseProxys(proxys.data);
    console.log(`[ +${conf.verbose.printOK(this.proxys.length)} proxys ]`);
    await this.testProxys();
  }

  /**
   * @description Update the global progress bar
   */
  updatedPBStatus() {
    return {
      working: conf.verbose.printOK(this.proxys.filter((p) => p.status === true).length),
      notWorking: conf.verbose.printNOK(this.proxys.filter((p) => !p.status).length),
      tested: this.proxys.filter((p) => p.testEnd).length,
      timeout: this.endTime.diff(moment.now(), 'seconds'),
      total: this.proxys.length,
    };
  }

  /**
   * @description Test the fetched proxys
   */
  async testProxys() {
    conf.verbose.displayTitle('Testing');
    this.pb.start(this.proxys.length, 0, this.updatedPBStatus());
    // Testing every proxys against a working HTTP server
    setInterval(() => {
      this.pb.update(
        this.updatedPBStatus().tested,
        this.updatedPBStatus(),
      );
    }, 100);
    await Promise.all(this.proxys.map(async (proxy) => {
      const proxyPB = this.proxysPB.create(2000, 0, {
        proxyHost: proxy.host,
        status: conf.verbose.printMEH('Testing'),
      });
      await proxy.test(proxyPB);
    }))
      // Once tested, display a report
      .then(async () => {
        this.proxysPB.stop();
        this.pb.stop();
        this.displayStatus();
        if (this.proxys.filter((p) => p.status).length === 0) {
          console.log('No working proxy found');
        } else await this.saveProxys();
      });
  }

  /**
   * @description Display tested proxy status
   */
  displayStatus() {
    const working = `[ ${conf.verbose.printOK(this.proxys.filter((p) => p.status === true).length)}`;
    const notworking = ` + ${conf.verbose.printNOK(this.proxys.filter((p) => !p.status).length)}`;
    const total = ` = ${[
      ...this.proxys,
    ].length
    }/${this.proxys.length} proxys tested ]`;
  }

  /**
   * @description Parse the fetched proxys
   * @param {Object} rawProxys Raw proxy
   */
  async parseProxys(rawHTML) {
    try {
      const $ = cheerio.load(rawHTML);
      Array.from(this.provider.list($(rawHTML))).forEach((possibleProxy) => {
        if (this.provider.https($(possibleProxy))) {
          const proxy = new Proxy({
            host: this.provider.host($(possibleProxy)),
            port: this.provider.port($(possibleProxy)),
          });
          this.proxys.push(proxy);
        }
      });
    } catch (e) {
      errors.errorHandler(e, 'Parsing error');
    }
  }

  /**
   * @description Save the fetched proxys
   */
  async saveProxys() {
    conf.verbose.displayTitle('Saving');
    const fileName = `./proxy-${new conf.moment().format('DDMMYYHHmm')}.json`;
    fs.writeFileSync(fileName, JSON.stringify(this.proxys), {
      flag: 'w+',
    });
    console.log(
      `[ ${fileName} ]`,
    );
  }
}
module.exports = ProxyService;
