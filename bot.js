#!/usr/bin/env node

var irc = require('irc');
var shorturl = require('shorturl');
var config = require('./config');

console.log('Connecting to '+config.server+':'+config.options.port);

var bot = new irc.Client(config.server, config.nick, config.options);

bot.addListener('message', function (from, to, message) {
    console.log('%s => %s: %s', from, to, message);
    if (to.match(/^[#&]/)) {
        // channel message
        if (message.match(/http/)) {
            var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
            var title = null;
            var http;

            if (message.match(/https/))
                http = require('https');
            else
                http = require('http');

            http.get(message, function (response) {
                response.on('end', function() {
                    shorturl(message, function(result) {
                        if (title !== null)
                            bot.say(to, result + ' ['+title+']');
                        else
                            bot.say(to, result);
                    });
                });

                response.on('data', function (chunk) {
                    var str=chunk.toString();
                    var match = re.exec(str);
                    if (match !== null && match.length >= 3 && match[2] !== undefined) {
                        title = match[2];
                    }
                });    
            }).on('error', function(e) {
                bot.say(to, 'bleh, http error');
            });
        }
    }
});

bot.addListener('error', function(message) {
    console.error('ERROR: %s: %s', message.command, message.args.join(' '));
});
bot.addListener('pm', function(nick, message) {
    console.log('Got private message from %s: %s', nick, message);
});
bot.addListener('join', function(channel, who) {
    console.log('%s has joined %s', who, channel);
});
bot.addListener('part', function(channel, who, reason) {
    console.log('%s has left %s: %s', who, channel, reason);
});
bot.addListener('kick', function(channel, who, by, reason) {
    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
});