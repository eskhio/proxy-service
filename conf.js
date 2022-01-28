const chalk = require("chalk");
const verbose = require("./verbose.js");
const moment = require("moment");

module.exports = {
	verbose: verbose,
	moment: moment,
	chalk: chalk,
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
