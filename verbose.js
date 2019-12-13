const chalk = require("chalk");
const conf = require("./conf");
const moment = require("moment")
const verbose = module.exports = {
	/**
	 * @description Classic logs
	 */
	log: require("log-with-statusbar")().configure({
		concat: {
			separator: "\t",
		},
	}),
	/**
	 * @description Special logs for titles
	 */
	logError: require("log-with-statusbar")().configure({
		tag: {
			maxVerbosity: 1,
			enableStatusBar: false,
		},
		concat: {
			separator: "\t",
		},

	}).error,
	/**
	 * @description Special logs for titles
	 */
	logDebug: require("log-with-statusbar")().configure({
		tag: {
			tag: true,
			maxVerbosity: 2,
			enableStatusBar: false,
		},
		concat: {
			separator: "\t",
		},

	}).debug,
	/**
	 * @description Special logs for titles
	 */
	/**
	 * @description Special logs for titles
	 */
	logTitle: require("log-with-statusbar")().configure({
		tag: {
			tag: false,
			maxVerbosity: 3,
			enableStatusBar: false,
		},
		concat: {
			separator: "\n",
		},
	}),
	/**
	 * @description Special logs for titles
	 */
	logResult: require("log-with-statusbar")().configure({
		time: false,
		tag: false,
		maxVerbosity: 4,
		concat: {
			separator: "\t",
		},
		render(text, {}) {
			verbose.log.configure({
				tag: {
					maxVerbosity: 4,
				},
			})(text);
		},
		stringify: { maxDepth: 5, maxArrayLength: 30}
	}),
	/**
	 * @description Display an update about the proxy testing status
	 */
	proxyTestingPB: {
		i: 0,
		spinners: (_) => verbose.log.getSpinners(),
		frames: (_) => verbose.proxyTestingPB.spinners().arc.frames,
		framesLength: (_) => verbose.proxyTestingPB.frames().length,
		start: (proxys, endTime) => this.interval = setInterval((proxys) => {
			let diff = moment.duration(new moment().diff(endTime)).seconds();
			// Inc the display
			verbose.proxyTestingPB.i++;
			// We create the spinner out of the frames
			const spinner = verbose.proxyTestingPB.frames()[
				verbose.proxyTestingPB.i % verbose.proxyTestingPB.framesLength() 
			].toString();
			const updateText = `${spinner} Updating proxys status ${proxys.testStatus()} ${diff}s`;
			verbose.log.setStatusBarText(["----------", updateText, "----------"]);
		}, 100, proxys),
		stop: (_) => {
			clearInterval(this.interval);
			verbose.log.setStatusBarText([""]);
		},
	},
	/**
	 * @description Display an update about the proxy testing status
	 */
	loadBalancePB: {
		i: 0,
		spinners: (_) => verbose.log.getSpinners(),
		frames: (_) => verbose.loadBalancePB.spinners().arc.frames,
		framesLength: (_) => verbose.loadBalancePB.frames().length,
		start: (proxys, nbUrls, endTime) => this.interval = setInterval((proxys) => {
			// Inc the display
			verbose.loadBalancePB.i++;
			// We create the spinner out of the frames
			const spinner = verbose.loadBalancePB.frames()[
				verbose.loadBalancePB.i % verbose.loadBalancePB.framesLength()
			].toString();
			let diff = moment.duration(new moment().diff(endTime)).seconds();
			const updateText = `${spinner} Load balancing status ${proxys.taskStatus(nbUrls)} ${diff}s`;
			verbose.log.setStatusBarText(["----------", updateText, "----------"]);
		}, 100, proxys),
		stop: (_) => {
			clearInterval(this.interval);
			verbose.log.setStatusBarText([""]);
		},
	},
	// Colored outputs
	printOK: (text) => chalk.bold.green(text),
	printNOK: (text) => chalk.bold.red(text),
	printMEH: (text) => chalk.bold.yellow(text),
	/**
	 * @description Display a title
	 * @param {String} title Display a title
	 */
	displayTitle(title) {
		verbose.logTitle(
			`${chalk.bold.blue("\n------------------")}`,
			`${chalk.bold("---- "+title+" ----")}`,
			`${chalk.bold.blue("------------------")}`,
		);
	},
	/**
	 * @description Test argument to hit a debug env
	 */
	debugMode: () => {
		for (const arg of process.argv) {
			if (/-debug/.test(arg)) {
				verbose.logError = verbose.logError.verbosity(arg.match(/=(.*)/)[1]);
				verbose.logTitle = verbose.logTitle.verbosity(arg.match(/=(.*)/)[1]);
				verbose.logDebug = verbose.logDebug.verbosity(arg.match(/=(.*)/)[1]);
				verbose.logResult = verbose.logResult.verbosity(arg.match(/=(.*)/)[1]);
				verbose.log = verbose.log.verbosity(arg.match(/=(.*)/)[1]);
			}
		}
	},
};
verbose.log.setStatusBarText([]);
verbose.debugMode();
