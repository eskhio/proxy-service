const chalk = require('chalk');
const moment = require('moment');

const verbose = module.exports = {
  // Colored outputs
  printOK: (text) =>  chalk.bold.green(text),
  printNOK: (text) => chalk.bold.red(text),
  printMEH: (text) => chalk.bold.yellow(text),
  /**
	 * @description Display a title
	 * @param {String} title Display a title
	 */
  displayTitle(title) {
    console.log(
      `${chalk.bold.blue('\n------------------')}`,
      `${chalk.bold(`---- ${title} ----`)}`,
      `${chalk.bold.blue('------------------')}`,
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
// verbose.log.setStatusBarText([]);
// verbose.debugMode();
