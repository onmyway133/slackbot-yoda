'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var sqlite = require('sqlite3').verbose();
var Bot = require('slackbots');

var Yoda = function Constructor(settings) {
	this.settings = settings
	this.settings.name = this.settings.name || 'yoda';
	this.dbPath = settings.dbPath || path.resolve(process.cwd(), '../data', 'data.db');

	this.user = null;
	this.db = null;
};

util.inherits(Yoda, Bot);

module.exports = Yoda;

Yoda.prototype.run = function() {
	Yoda.super_.call(this, this.settings);

	this.on('start', this.onStart);
	this.on('message', this.onMessage);
};

Yoda.prototype.onStart = function() {
	this.loadBotUser();
	this.connectDB();
	this.firstRunCheck();

	this.welcomeMessage();
};

Yoda.prototype.loadBotUser = function() {
	var self = this;
	this.user = this.users.filter(function (user) {
		return user.name == self.name;
	})[0];
}

Yoda.prototype.connectDB = function() {
	if (!fs.existsSync(this.dbPath)) {
		console.error('Database path ' + this.dbPath + ' does not exists')
		process.exit(1);
	}

	this.db = new sqlite.Database(this.dbPath);
};

Yoda.prototype.firstRunCheck = function() {
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function(error, record) {
		if (error) {
			return console.error('DATABASE ERROR:', error);
		}

		var currentTime = (new Date()).toJSON();

		if (!record) {
			return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
		}

		self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
	})
};

Yoda.prototype.welcomeMessage = function() {
	this.postMessageToChannel(this.channels[0].name, 'May the Force be with you', {as_user: true});
};

Yoda.prototype.onMessage = function(message) {
	console.log(message);

	if (this.isChatMessage(message) 
		&& this.isChannelConversation(message)
		&& !this.isFromBot(message)
		&& this.isMentioningBot(message)
	) {
		this.reply(message);
	}
};

Yoda.prototype.isChatMessage = function(message) {
	return message.type === 'message';
};

Yoda.prototype.isChannelConversation = function(message) {
	return typeof message.channel === 'string' && message.channel[0] === 'C';
};

Yoda.prototype.isFromBot = function(message) {
	return message.user === this.user.id;
};

Yoda.prototype.isMentioningBot = function(message) {
	return message.text.toLowerCase().indexOf('yoda') > -1 
		|| message.text.toLowerCase().indexOf(this.name) > -1
		|| message.text.indexOf(this.user.id) > -1;
};

Yoda.prototype.reply = function(message) {
	var self = this;

	self.db.get('SELECT id, quote from quotes ORDER BY used ASC, RANDOM() LIMIT 1', function(error, record) {
		if (error) {
			return console.error('DATABASE ERROR:', error);
		}

		var channel = self.getChannelById(message.channel)
		self.postMessageToChannel(channel.name, record.quote, {as_user: true});
		self.db.run('UPDATE quotes SET used = used + 1 WHERE id = ?', record.id);
	});
};

Yoda.prototype.getChannelById = function(channelId) {
	return this.channels.filter(function(item) {
		return item.id === channelId;
	})[0];
};