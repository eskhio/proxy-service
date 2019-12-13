const chalk = require("chalk");
const verbose = require("./verbose.js");
const moment = require("moment");

module.exports = {
	verbose: verbose,
	moment: moment,
	/**
	 * @description Handle non-net errors
	 * @param {String} details The error details
	 * @param {String} title The error title
	 */
	errorHandler: (details, title = "") => {
		// Error
		const messageDetails = details;
		const messageTitle = chalk.bold(` ${(title || "")}`);
		verbose.logError(`${messageTitle}`, "->", `${messageDetails.stack}`);
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
