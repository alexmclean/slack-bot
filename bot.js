/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Run your bot from the command line:
    token=<MY TOKEN> node bot.js
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('Botkit');
var os = require('os');
var request = require('request');

var repo = "mirthfulchuksha/dtbs";
var placeID = 5391997;

//special character encodings
//surround these with <> to tag users or groups
var atSign = "@U024BE7LH";
var hashtag = "#C024BE7LR";

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM();


controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err,res) {
    if (err) {
      bot.log("Failed to add emoji reaction :(",err);
    }
  });


  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
});

//WEATHER info
controller.hears(['weather', 'outside'], 'direct_message,direct_mention,mention', function (bot, message) {
  var id = placeID;
  var url = 'http://api.openweathermap.org/data/2.5/weather?id=' + id + '&appid=8ebbea68955b3275135765ecaf17809c';

  request({url: url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      var farenheit = Math.round((data.main.temp * (9/5.0)) - 459.67);
      bot.reply(message, "The weather in " + data.name + " is " + data.weather[0].main.toLowerCase() + " with a temperature of " + farenheit + " degrees.");
    }
  });
});

/*
  GIT statistics and informative responses
*/
//COMMIT ACTIVITY
controller.hears(['project', 'activity'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  var repository;
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.repository) {
      repository = user.repository;
    } else {
      console.log("oops");
      repository = repo;
    }
  });

  var options = {
    url : "https://api.github.com/repos/" + repository + "/stats/commit_activity",
    headers : {
      'User-Agent': 'alexmclean'
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var parsedBody = JSON.parse(body);
      var lastWeekActivity = parsedBody[parsedBody.length -1];
      bot.reply(message, ":computer: You have " + lastWeekActivity.total + " commits this week from " + repository + "!");
    }
  });
});

//CONTRIBUTIONS BREAKDOWN
controller.hears(['contributions'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  var repository;
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.repository) {
      repository = user.repository;
    } else {
      console.log("oops");
      repository = repo;
    }
  });

  var options = {
    url : "https://api.github.com/repos/" + repository + "/stats/contributors",
    headers : {
      'User-Agent': 'alexmclean'
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var parsedBody = JSON.parse(body);
      
      var people = [];
      for(var i = 0; i < parsedBody.length; i++) {
        var person = parsedBody[i];
        var userObj = {name: person.author.login};
        var totalContribs = 0;
        //tally up additions and deletions from every week
        for(var week = 0; week < person.weeks.length; week++) {
          totalContribs += person.weeks[week].a - person.weeks[week].d;
        }
        //create list of objects containing the username and total contribs
        userObj.total = totalContribs;
        people.push(userObj);
      }

      var response = ":thumbsup:  Here is the contribution break down for " + repository + ":\n";
      for(var person = 0; person < people.length; person++) {
        response += people[person].name + ", " + people[person].total + " lines added\n";
      }
      bot.reply(message, response);
    }
  });
});

//OPEN PULL REQUESTS
controller.hears(['pull request', 'pull requests', 'pulls'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  var repository;
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.repository) {
      repository = user.repository;
    } else {
      console.log("oops");
      repository = repo;
    }
  });

  var options = {
    url : "https://api.github.com/repos/" + repository + "/pulls",
    headers : {
      'User-Agent': 'alexmclean'
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var parsedBody = JSON.parse(body);
      
      bot.reply(message, ":thumbsup: Looks like you have " + parsedBody.length + " open pull requests from " + repository + "!");
    }
  });
});

//GITHUB ISSUES
controller.hears(['issues', 'waffle'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  var repository;
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.repository) {
      repository = user.repository;
    } else {
      console.log("oops");
      repository = repo;
    }
  });

  var options = {
    url : "https://api.github.com/repos/" + repository + "/issues",
    headers : {
      'User-Agent': 'alexmclean'
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var parsedBody = JSON.parse(body);
      var response = ":thumbsup: Looks like you have " + parsedBody.length + " open git issues from " + repository + "!";

      response += '\n\nHere:\n\n';
      for(var i = 0; i < parsedBody.length; i++){
        var task = parsedBody[i];
        var user = task.assignee;
        if(user) {
          user = user.login;
        } else {
          user = "Nobody";
        }
        response += "#" + task.number + ":  " + task.title + " assigned to *" + user + '*\n';
      }

      bot.reply(message, response);
    }
  });
});

/*
  Naming / identifying
*/

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function (bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + user.name + " from now on.");
    })
  })
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function (bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});

controller.hears(['my repo is (.*)'],'direct_message,direct_mention,mention',function (bot,message) {
  var matches = message.text.match(/my repo is (.*)/i);
  var repository = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.repository = repository;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. Your Github repo is " + user.repository + " from now on.");
    })
  })
});

controller.hears(['what is my repo','which repo'],'direct_message,direct_mention,mention',function (bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.repository) {
      bot.reply(message,"Your repo is " + user.repository);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  });
});

/*
  //goofy stuff
*/
controller.hears(['sexy'], 'direct_message,direct_mention,mention', function (bot, message) {
  bot.reply(message, ":kissing_closed_eyes:");
});

controller.hears(['who do you work for'], 'direct_message,direct_mention,mention', function (bot, message) {
  bot.reply(message, "I work for DTBS, better known as 'Down To Be Sexy'!");
});

/*
  Bot shutdown and self identification
*/

controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.startConversation(message,function(err,convo) {
    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response,convo) {
          convo.say("*Phew!*");
          convo.next();
        }
      }
    ])
  })
});


controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ".");

})

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}