const conf = require("./conf");

module.exports = {
    /**
	 * @description Handle non-net errors
	 * @param {Object} error The error details
	 */
	errorHandler: (error) => {
		// Error
		const messageDetails = error.stack;
		const messageTitle = `${error.title}`;
		return conf.verbose.printNOK(`${messageDetails}`);
		process.exit();
	},
    /**
	 * @description Handle net errors
	 * @param {String} error The net error
	 * @param {String} details The error title
	 */
	netErrorHandler: (error, details) => {
		// Error
		let messageDetails = "";
		const messageTitle = `${(details || "")}`;
		if (/EPROTO.*SSL/.test(error.message)) messageDetails = "SSL issue";
		else if (error.response && error.response.data) {
			// The request was made and the server responded with a status code that falls out of the range of 2xx
			if (/squid/.test(error.response.data)) messageDetails += "Squid issue";
			else messageDetails += "Proxy issue";
		} else if (error.request) {
			messageDetails +=
			`${error.code} ${(error.address ? "on " + error.address : "")}: ${error.message ? error.message: ""}`;
		} else {
			// Something happened in setting up the request and triggered an Error
			messageDetails += "Unknown error: " + JSON.stringify(error);
		}
		return conf.verbose.printNOK(conf.chalk.red(`${messageDetails}`));
	},
}