'use strict';

var Yoda = require('./yoda');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var yoda = new Yoda({
	token: token,
	dbPath: dbPath,
	name: name
});

yoda.run();