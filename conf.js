const chalk = require("chalk");
const verbose = require("./verbose.js");
const moment = require("moment");

module.exports = {
	verbose: verbose,
	moment: moment,
	chalk: chalk,
	/**
	 * @description Handle non-net errors
	 * @param {String} details The error details
	 * @param {String} title The error title
	 */
	errorHandler: (error) => {
		// Error
		let messageDetails = error.stack;
		let messageTitle = ` ${error.title}`;
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
