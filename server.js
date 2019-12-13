/* eslint-disable require-jsdoc */
const express = require("express");
const bodyParser = require("body-parser");


const fs = require("fs");
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(bodyParser.text());
app.use(bodyParser.json({
	type: "application/json",
}));
app.get("/", (req, res) => res.json({
	message: "Test server online",
}));
app.listen(3000);
// Mock data
const mockProxys = fs.readFileSync("./mock/proxypage.html").toString();

displayServerTitle("Starting");
// Routes
app.all("/proxys", function (req, res) {
	displayFormatedRequest(req, "Proxys list", "html");
	displayFormatedResponse(mockProxys, "html");
	res.send(mockProxys);
});

function displayServerTitle(rawTitle, additionalInfo) {
	let title = new moment().format("DD/MM/YYYY - HH:mm:ss") + " - ";
	if (additionalInfo) title += additionalInfo + " - ";
	title += rawTitle;
	const separator = "-".repeat(title.length);
	console.log(chalk.blue(separator));
	console.log(chalk.green(title));
	console.log(chalk.blue(separator));
}

function displayFormatedRequest(req, name = "", format = "json") {
	displayTitle(name, "for " + req.url);
	console.log(req.method.toUpperCase() + " " + req.url + " HTTP/1.1");
	for (header of Object.entries(req.headers)) {
		if (typeof header[1] == "string") {
			console.log(header[0] + ": " + header[1])
		};
	}
	if (req.data) {
		if (format == "json") console.log("\n" + JSON.stringify(req.data));
		else console.log("\n" + req.data);
	}
	console.log(chalk.blue("\n\n---------------------------"));
}

function displayFormatedResponse(res) {
	console.log(chalk.bgCyan("Body: "));
	console.log(chalk.bgCyan(JSON.stringify(res.data)));
	console.log(chalk.blue("---------------------------\n\n"));
}

function displayFormatedResponseHeader(res) {
	console.log(chalk.bgMagenta("Headers: "));
	for (header of Object.entries(res.headers)) {
		console.log(chalk.bgMagenta(header[0] + ": " + header[1]));
		if (/set-cookie/i.test(header)) {
			console.log(header[1]);
		}
	}
	console.log(chalk.blue("\n\n---------------------------"));
}
module.exports = app;
