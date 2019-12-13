const chalk = require("chalk");
const verbose = require("./verbose.js");
const moment = require("moment");

module.exports = {
	verbose: verbose,
	moment: moment,
	chalk: chalk,
	/**
	 * @description Handle non-net errors
	 * @param {Object} error The error details
	 */
	errorHandler: (error) => {
		// Error
		const messageDetails = error.stack;
		const messageTitle = ` ${error.title}`;
		verbose.logError(`${messageTitle}`, "->", `${messageDetails}`);
		process.exit();
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

};
