const tmi = require('tmi.js');
const keys = require('./config/keys');
const blacklist = require('./config/blacklist');
const witzejson = require('./config/witze.json');
const qoutejson = require('./config/qoutes.json');

const channelusername = 'username';
const channeluserid = 999999999;

const minimumHostCount = 1;

const options = {
    options: {
        debug: true
    },
    connection: {
        cluster: 'aws',
        reconnect: true
    },
    identity: {
        username: 'ZiturionBot',
        password: keys.twitch.oauthpassword
    },
    channels: [channelusername]
};

const querystring = require('querystring'),
    fetch = require('node-fetch');

const qUrl = 'https://api.twitch.tv/helix/streams?user_login=' + channelusername;
const uUrl = 'https://api.twitch.tv/helix/users?login=';
var followUrl = 'https://api.twitch.tv/helix/users/follows?from_id=';

const fetchArgs = {
    headers: {
        'Client-ID': keys.twitch.Client_ID
    }
};

var moderatorList;

const client = new tmi.client(options);
client.connect();

client.on('connected', (adress, port) => {
    client.action(channelusername, 'Loading ZiturionBot...');
});

client.on('chat', (channel, user, message, self) => { //e.g. message: !Example arg1 arg2
    if (self || message[0] !== '!') return; //ignore own messages

    let params = message.split(' '); //parameter: arg1 arg2
    let command = params.shift().slice(1).toLowerCase(); //slice the !

    sayCommand(channel, user, command, params);
});

client.on('hosted', (channel, username, viewers, autohost) => {
    if (viewers < minimumHostCount)
        return; //return 0 people hosts
    var autohosttext = autohost ? '(autohost)' : '';
    client.action(channelusername, username + ' bringt ' + viewers + ' Zuschauer mit.' + autohosttext);
});

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);
    var timestring = '';

    if (interval >= 1) {
        timestring += interval + ' Jahr' + (interval == 1 ? ', ' : 'e, ');
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        timestring += interval % 12 + ' Monat' + (interval == 1 ? ', ' : 'e, ');
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        timestring += interval % 30 + ' Tag' + (interval == 1 ? ', ' : 'e, ');
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        timestring += interval % 24 + ' Stunde' + (interval == 1 ? ', ' : 'n, ');
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        timestring += interval % 60 + ' Minute' + (interval == 1 ? ', ' : 'n, ');
    }
    return timestring += seconds % 60 + ' Sekunde' + (seconds == 1 ? '' : 'n');
}

function sayCommand(channel, user, command, params) {
    //Commands
    switch (command) {
        case 'uptime':
            fetch(qUrl, fetchArgs)
                .then(res => res.json())
                .then(data => {
                    var uptimeString = '';
                    if (typeof data.data[0] == 'undefined')
                        uptimeString = 'Der Stream ist momentan nicht erreichbar...';
                    else {
                        uptimeString = 'Der Stream geht schon ' + timeSince(new Date(data.data[0]['started_at'])) + ' lang.';
                    }
                    client.say(channelusername, '[Uptime] ' + uptimeString);
                })
                .catch(err => console.error(err));
            break;
        case 'twitter':
        case 'social':
            client.say(channelusername, '[Social] Yo ' + user['display-name'] + ', du findest mich auf Twitter unter: https://twitter.com/Ziturion.');
            break;
        case 'info':
            client.say(channelusername, '[Info] Mein Name ist Daniel, ich bin 23 und wohne in NRW.');
            break;
        case 'teamspeak':
        case 'ts':
            client.say(channelusername, '[Teamspeak] IP: 176.9.41.211:10900');
            break;
        case 'discord':
            client.say(channelusername, '[Discord] Der Discord ist noch nicht eingerichtet. Nutz erstmal den !teamspeak oder Stephans Discord: https://discord.gg/5XfDpjb.');
            break;
        case 'instagram':
        case 'insta':
            client.say(channelusername, '[Instagram] Hey ' + user['display-name'] + ', auf Instagram findest du mich unter: https://www.instagram.com/ziturion.');
            break;
        case 'followed':
        case 'follow':
			var usernameid = user['user-id'];
			if (params.length >= 1) {
				fetch(uUrl + params[0], fetchArgs)
                .then(res => res.json())
                .then(data => {
					console.log(data.data);
					usernameid = data.data[0]['id'];
				})
				.then(data => {
					console.log(followUrl + usernameid);
					fetch(followUrl + usernameid, fetchArgs)
					.then(res => res.json())
					.then(data => {
						var uptimeString = '';
						if (typeof data.data[0] == 'undefined')
							uptimeString = 'Du folgst mir nicht :c';
						for (var i = 0; i < data.data.length; i++) {
							if (data.data[i]['to_id'] == channeluserid) {
								uptimeString = timeSince(new Date(data.data[i]['followed_at']));
								break;
							}
							uptimeString = 'Du folgst mir nicht :c';
						}
						client.say(channelusername, '[Follow] ' + uptimeString);
						})
						.catch(err => console.error(err));
				})
				.catch(err => console.error(err));
			}
			else { //no args
				console.log(followUrl + usernameid);
				fetch(followUrl + usernameid, fetchArgs)
				.then(res => res.json())
				.then(data => {
					var uptimeString = '';
					console.log(data);
					if (typeof data.data[0] == 'undefined')
						uptimeString = 'Du folgst mir nicht :c';
					for (var i = 0; i < data.data.length; i++) {
						if (data.data[i]['to_id'] == channeluserid) {
							uptimeString = timeSince(new Date(data.data[i]['followed_at']));
							break;
						}
						uptimeString = 'Du folgst mir nicht :c';
					}
					client.say(channelusername, '[Follow] ' + uptimeString);
					})
					.catch(err => console.error(err));
			}
            break;
        case 'watchtime':
            client.say(channelusername, '[Watchtime] Das ist leider noch nicht eingerichtet...');
            break;
        case 'liebe':
            var lovestring = '';
            getRandomChatter(channelusername, { skipList: [user['display-name'].toLowerCase()] })
                .then(useritem => {
                    if (useritem === null) {
                        lovestring = user['display-name'] + ', sorry es ist gerade niemand da :(';
                    }
                    else {
                        let { name, type } = useritem;
                        lovestring = user['display-name'] + ' und ' + name + ' passen zu ' + getRandomInt(1, 100) + '% zusammen. bleedPurple';
                    }
                    client.say(channelusername, '[Fun] ' + lovestring);
                });
            break;
        case 'hug':
            if (params.length < 1) {
                var hugstring = '';
                getRandomChatter(channelusername, { skipList: [user['display-name'].toLowerCase()] })
                    .then(useritem => {
                        if (useritem === null) {
                            hugstring = user['display-name'] + ', sorry es ist gerade niemand da :(';
                        }
                        else {
                            let { name, type } = useritem;
                            hugstring = user['display-name'] + ' wirft sich durch den Chat und umarmt ' + name + ' zufällig! bleedPurple';
                        }
                        client.say(channelusername, '[Fun] ' + hugstring);
                    });
            }
            else {
                client.say(channelusername, '[Fun] ' + user['display-name'] + ' umarmt ' + params[0] + ' ganz ganz doll! <3 bleedPurple <3');
            }
            break;
        case 'witz':
        case 'flachwitz':
            var witzarray = witzejson['witze'];
            var witz;
            if (params.length < 1) {
                witz = witzarray[getRandomInt(0, witzarray.length)];
            }
            else {
                if (typeof witzarray[params[0]] != 'undefined') {
                    witz = witzarray[params[0]];
                } else {
                    witz = 'Usage: !witz <number> (optional, must be in Range: ' + (witzarray.length - 1) + ')';
                }
            }
            client.say(channelusername, '[Fun] ' + witz);
            break;
        case 'qoute':
            var qoutearray = qoutejson['qoutes'];
            var qoute;
            if (params.length < 1) {
                qoute = qoutearray[getRandomInt(0, qoutearray.length)];
            }
            else {
                if (typeof qoutearray[params[0]] != 'undefined') {
                    qoute = qoutearray[params[0]];
                } else {
                    qoute = 'Usage: !qoute <number> (optional, must be in Range: ' + (qoutearray.length - 1) + ')';
                }
            }
            client.say(channelusername, '[Qoute] ' + qoute);
            break;
        case 'commands':
        case 'cmd':
        case 'befehle':
            client.say(channelusername, '[Commands] Momentan gibt es diese Befehle: !uptime, !twitter, !info, !ts, !insta, !deathbrain, !followed, !hug <user>, !liebe, !flachwitz -~- unfertig: !watchtime, !discord');
            break;
        default:
        //default Block
    }

    //Mod Commands
    if (user['mod'] || user['display-name'] == channelusername) {
        switch (command) {
            case 'disconnect':
                client.action(channelusername, 'Disconneting...');
                client.disconnect();
                break;
			case 'refresh': //not implemented
                client.action(channelusername, 'Reloading... (not tested)');
                client.disconnect();
                client.connect();
                break;
            case 'addqoute':
                client.say(channelusername, '[Qoute] ' + addQoute('test 1.1.2028'));
                break;
        default:
            //default Block
        }
    }

    //filter Moderators and streamer
    if (user['mod'] || user['display-name'] == channelusername) return;

    //Timeouts
    switch (command) {
        case '<message deleted>':
        case '<nachricht gelöscht>':
            client.timeout(channelusername, user['display-name'], 20, 'Fake Purge');
            client.action(channelusername, user['display-name'] + ', bitte keine Fake Purges. Danke.');
            break;
        default:
        //default Block
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getChatters(channelName, _attemptCount = 0) {
    return fetch('https://tmi.twitch.tv/group/user/' + channelusername + '/chatters', fetchArgs)
        .then(res => res.json())
        .then(data => {
            return Object.entries(data.chatters)
                .reduce((p, [type, list]) => p.concat(list.map(name => {
                    if (name === channelName) type = 'broadcaster';
                    return { name, type };
                })), []);
        })
        .catch(err => {
            if (_attemptCount < 3) {
                return getChatters(channelName, _attemptCount + 1);
            }
            throw err;
        })
}

function getRandomChatter(channelName, opts = {}) {
    let {
        onlyViewers = false,
        noBroadcaster = false,
        skipList = []
    } = opts;
    return getChatters(channelName)
        .then(data => {
            let chatters = data
                .filter(({ name, type }) =>
                    !(
                        (onlyViewers && type !== 'viewers') ||
                        (noBroadcaster && type === 'broadcaster') ||
                        skipList.includes(name)
                    )
                );
            return chatters.length === 0 ?
                null :
                chatters[Math.floor(Math.random() * chatters.length)];
        });
}

function addQoute(qoute) {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var date = new Date();
    date.toLocaleDateString('en-US', options);
    qoutejson['qoutes'].push(qoute);
    return 'qoutes kann man bisher nur manuell hinzufügen';
}