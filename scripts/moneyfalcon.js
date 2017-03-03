// MoneyBot 3.0 - moneybot3.js
// Authors: Joe 'currentsea' Bull & Martin Markowski 
// https://github.com/currentsea/moneybot 

/* BEGIN LICENSE */ 
// Copyright (c) 2017 Joseph 'currentsea' Bull

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
/* END LICENSE */ 

/** VARIABLE DECLARATIONS */ 
var username = 'beebo' 
var startingbet = 1; 
var betincrement = 1.065; 
var takeprofitpoint = 1899; 
var gamesplayedcount = 0; 
var takeprofitincrementinterval = 0.9999; 
var playgamecriteria = 1866; 
var gamewaitcount = 3; 
var moneybot = 0; 
var medianupper = 1.96; 
var maxwinninggames = 33; 
var maxlosinggames = 33; 
var resetlosscountonwin = false; 
var winningstreakbetincrement = 1; 
var abortwhenmedianfails = 0; 
var abortonfailedentrycriteria = 0; 
var botpriority = 1;    
var bethistory = []; 
var gamehistory = [];  
var gameresults = []; 
var gamerecords = {}; 
var historicalmedian = 197; 
console.log('starting median: ' + historicalmedian); 
var currentbet = startingbet; 
var multiplier = takeprofitpoint;
var triggeredbusts = 0; 
var grosswinnings = 0; 
var grosslosses = 0; 
var numwinners = 0; 
var numlosers = 0; 
var numskipped = 0; 
var netprofits = 0; 
var totalprofit = 0; 
var losingsteak = 0; 
var paperbetting = 0; 
var moneybotlength = 0; 
var moneybotconfirmations = 0;
var gameselapsed = 0; 
var verbose = false; 
var state = 0; 
var winrate = 0;
var chatbet = false; 
var mimic = false; 
var startingbalance = engine.getBalance(); 
var currentbalance = startingbalance; 
var pregamebalance = currentbalance; 
var laststatus = engine.lastGamePlay(); 
var targetmimic = 'MountainDew'; 
var curgamerecord = {}; 
var usersplaying = []; 
var falconexample = "FALCON mimic abc";
var mimicbet = 0; 
var falconregexp = /(?:^|\s)FALCON\s(.*?)\s(.*?)\s(.*)(?:\s|$)/g;
var gamemode = "MARTINGALE"; 
var martingalecount = 0; 
var martingalebet = startingbet; 
var martingaletpi = takeprofitpoint; 

/** BEGIN ENGINE INSTRUCTIONS */ 
engine.on('game_starting', start_game); 

engine.on('game_started', play_game); 

engine.on('game_crash', finish_game); 

engine.on('player_bet', process_player_bet); 

engine.on('cashed_out', cashout); 

engine.on('connected', script_connected); 

engine.on('disconnected', script_disconnected); 

engine.on('msg', process_chat_message); 
/** END ENGINE INSTRUCTIONS */ 


/** BEGIN ENGINE LOGIC */ 
function script_connected(gamedata) { 
    console.log('script connected'); 
    engine.chat("[MONEYFALCON] The money falcon has come online"); 
    console.log('game history shown below upon connection'); 
    console.log(JSON.stringify(gamehistory)); 
} 

function script_disconnected(gamedata) { 
    console.log('script disconnected, stopping all bets if one in progress...'); 
    engine.cashOut(cocallback);
    console.log('summarizing game history - JSON shown below'); 
    console.log(JSON.stringify(gamehistory)); 
    console.log('stopping script'); 
    engine.stop();  
}

function start_game(gamedata) { 
    log_pre_game_data(gamedata); 
    calculate_net_profits(); 
    console.log("game # " + gameselapsed + " is starting..."); 
    calculate_win_rate(); 
    summarize(); 
    pregamebalance = engine.getBalance(); 


    console.log('balance before game #' + gameselapsed + ': ' + pregamebalance); 

    if (gamemode == 'MIMIC') { 
        currentbet = mimicbet; 
        var themultiplier = 1900; 
        engine.placeBet(formatbet(currentbet), themultiplier, false); 
        mimic = false; 
        gamemode = "MARTINGALE"; 
        currentbet = startingbet; 
    } else if (gamemode == 'MARTINGALE') { 
        // var themultiplier = 1900; 
        martingaletpi = Math.round(martingaletpi).toFixed(0);  

        martingaletpi = parseInt("" + martingaletpi);        
        console.log('calling placebet ' + martingalebet + ' with take profit multiplier of ' + martingaletpi); 
        engine.placeBet(formatbet(martingalebet), martingaletpi, false); 
    }

    // gamerecords[gameselapsed] = {}; 
    // gamerecords[gameselapsed]['cashouts'] = []; 
    // gamerecords[gameselapsed]['initial_bets'] = {}; 

}

function formatbet(betamount) { 
    return Math.round(betamount).toFixed(0)*100; 
}

function cashout(gamedata) { 
    log_cashout_data(gamedata); 
    if (mimic == true && gamedata.username == targetmimic) { 
        engine.cashOut(true); 
        console.log('cashed out when ' + targetmimic + ' did'); 
    } 
    // gamerecords[gameselapsed]['cashouts'].push(gamedata); 
} 

function play_game(gamedata) { 
    var randindex = Math.floor((Math.random() * 10) + 1); // do not touch

    var count = 0; 
    for (var curuser in gamedata) { 
        if (count == randindex) { 
            console.log('THE RANDOM USER IS ' + curuser); 
        }
        count++; 
        // count++; 
    }
    if (verbose == true) { 
        console.log('index ' + randindex); 
        console.log("we are now playing the game");
        console.log(JSON.stringify(gamedata));  
        console.log('game #' + gameselapsed); 
    } 

    curgamerecord = gamedata; 

    for (var currentuser in gamedata) { 
        usersplaying.push(currentuser.username); 
    } 

    // if (gamedata['MountainDew'] == undefined) { 
        // engine.cashOut(true); 
        // console.log('mountain dew not playing'); 
    var founduser = false; 
    var targetindex = Math.floor((Math.random() * gamedata.length) + 1);
    for (var curuser in gamedata) { 
        if (curuser.username == targetmimic) { 
            founduser = true; 
        }
        // count++; 
    }

    if (founduser == false) { 
        var count = 0; 
        for (var curuser in gamedata) { 

            if (count > targetindex) { 
                targetmimic = curuser.username; 
                console.log('new target mimic: ' + targetmimic); 
            }

            count++; 
        }
    } 

        // var targetmimic = gamedata[targetindex].username; 
        // console.log('Changing mimic target to ' + targetmimic); 
    // }


    console.log(JSON.stringify(gamerecords)); 
    // console.log(JSON.stringify(bethistory)); 
    // bethistory.push(gamedata); 
}

function process_player_bet(gamedata) { 
    if (verbose == true) { 
        console.log('player bet occurred'); 
        console.log(JSON.stringify(gamedata)); 
    } 
}

function process_chat_message(gamedata) { 
    if (verbose == true) { 
        console.log('--------- CHAT MESSAGE BELOW -----------'); 
        console.log(JSON.stringify(gamedata)); 
        console.log('---------- END CHAT MESSAGE ------------');
    } 
    if (gamedata.username == username) { 
        var match = falconregexp.exec(gamedata.message);

        if (match != undefined) { 
            var falconcommand = match[1]; 
            if (falconcommand == 'mimic') { 
                var mimicuser = match[2]; 
                targetmimic = mimicuser; 
                var amount = match[3]; 
                mimic = true; 
                gamemode = "MIMIC"; 
                mimicbet = parseInt(amount); 
                engine.chat('[FALCONBOT]: we will bet ' + mimicbet + ' bits and cash out the same time ' + mimicuser +' does next round (or 10x, whatever comes first)... [if ' + mimicuser + ' is not playing in the next round we will pick a user to follow at random]'); 
            } 
        } else { 
            if (gamedata.message == 'FALCON stop') { 
                console.log('FALCON is stopping'); 
                engine.chat('[FALCONBOT]: FALCON BOT stopping'); 
                engine.stop(); 
            }

            if (gamedata.message == 'FALCON status') { 
                console.log('FALCON is online'); 
                engine.chat('[FALCONBOT]: FALCON BOT is online +'); 
            }

            if (gamedata.message == 'FALCON gamecount') { 
                console.log('FALCON is online'); 
                gamesplayedcount = numwinners + numlosers; 
                engine.chat('[FALCONBOT]: Games Played: ' + gamesplayedcount + ' | Games Elapsed: ' + gameselapsed + ' | Games Won: ' + numwinners + ' | Games Lost: ' + numlosers + " | Median: " + historicalmedian); 
            } 

            if (gamedata.message == 'FALCON martingale') { 
                console.log('Setting game mode to martingale');
                gamemode = "MARTINGALE"; 
                engine.chat('[FALCONBOT]: Martingale mode activated.'); 
            }


        // if (gamedata.message == 'FALCON 5% doubler') { 
        //     console.log('FALCON is online'); 
        //     chatbet = true; 
        //     var gamesplayedcount = numwinners + numlosers; 
        //     engine.chat('[FALCONBOT]: betting 5% of account for 2x next game...'); 
        // }

        // if (gamedata.message == 'FALCON mimic $random_player 5%') { 
        //     console.log('FALCON is online'); 
        //     chatbet = true; 
        //     var gamesplayedcount = numwinners + numlosers; 
        //     var randomnum = Math.floor((Math.random() * usersplaying.length) + 1);
        //     var mimicuser =usersplaying[randomnum];  
        //     // for (var user in curgamerecord) { 
        //     //     if (count == randomnum) { 
        //     //         mimicuser = user.username; 
        //     //     }
        //     //     count = count + 1; 
        //     // }
        //     mimic = true; 
        }

    }
} 
/** END ENGINE LOGIC */ 

/** HELPERS */ 
function median(values) {
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    var themedian = 0; 
    if (values.length % 2 == 0) { 
        themedian = values[half];
    }
    else { 
        var numerator = (values[half-1] + values[half]); 
        themedian =  numerator / 2.0;
    }
    return themedian; 
}

function finish_game(gamedata) { 
    console.log("Game is finished"); 
    console.log(gamedata); 
    // console.log(gamerecords[gameselapsed]['cashouts']); 
    log_post_game_data(gamedata); 
    // gameselapsed = gameselapsed + 1; 
}

function log_pre_game_data(gamedata) { 

    console.log('--------------------------------------------'); 
    console.log('Game is starting - JSON shown below'); 
    console.log(JSON.stringify(gamedata)); 
} 

function log_post_game_data(gamedata) { 
    console.log('--------------------------------------------'); 
    console.log('Game is finished - JSON shown below'); 
    // console.log(JSON.stringify(gamedata)); 
    gamehistory.push(gamedata); 
    // console.log(JSON.stringify(gamehistory)); ingale
    summarize_history(gamedata); 
    console.log('MEDIAN: ' + historicalmedian); 
    var gameresultstatus = engine.lastGamePlay(); 
    laststatus = gameresultstatus; 
    if (gameresultstatus == 'WON') { 
        numwinners++; 
        gamesplayedcount++; 
        var baldiff = engine.getBalance() - pregamebalance; 
        grosswinnings += baldiff; 
    } else if (gameresultstatus == 'LOST') { 
        numlosers++; 
        gamesplayedcount++; 
        grosslosses += currentbet; 
    } else { 
        numskipped++; 
    } 

    if (gamemode == 'MIMIC' && mimic == true) { 
        if (laststatus == 'WON') { 
            engine.chat('[FALCONBOT] We mimicked ' + targetmimic + ' successfully and won the game!'); 
        } else if (laststatus == 'LOST') { 
            engine.chat('[FALCONBOT] We mimicked ' + targetmimic + ' and failed miserably'); 
        }
    } 

    if (gamemode == 'MARTINGALE') { 

        if (laststatus == 'WON') { 
           console.log('We won the martingale after ' + martingalecount + ' games.'); 
            martingalecount = 0; 
            martingalebet = startingbet; 
        } else if (laststatus == 'LOST') {
            martingalecount++; 
            console.log("we lost the martingale (turn number " + martingalecount + ')'); 
            martingalebet = martingalebet * betincrement; 
            martingaletpi = martingaletpi * takeprofitincrementinterval
            console.log('next game will use bet of ' + martingalebet + ' with a take profit multiplier of ' + martingaletpi); 
        }


    } 

    gameselapsed++; 
    mimic = false; 
    mimicbet = 0; 
    chatbet = false; 
    currentbalance = engine.getBalance(); 
    console.log("GAMES ELAPSED: " + gameselapsed); 
} 

function log_cashout_data(gamedata) { 
    if (verbose == true) {
        console.log('--------------------------------------------'); 
        console.log('Player cashed out - JSON shown below'); 
        console.log(JSON.stringify(gamedata)); 
    }
} 

function summarize_history(gamedata) { 
    medianvalues = []; 

    for (var gamehistoryitem in gamedata) {
      // sum += item;
      medianvalues.push(gamehistoryitem.game_crash); 
    }
    historicalmedian = median(medianvalues); 
    return historicalmedian; 

} 

function calculate_win_rate() { 
    console.log('calculating win rate'); 
    if (numwinners > 0 && numlosers > 0) {
        var modifier =  numwinners / numlosers; 
        winrate = modifier*100;
    }
    if (numwinners > 0 && numlosers == 0){
        winrate = 100;
    }
    console.log("win rate is currently " + winrate); 
    return winrate; 
} 

function calculate_net_profits() { 
    console.log("calculating net profits..."); 
    profits_have_changed = grosswinnings > 0 && grosslosses > 0; 
    var netchange = 0; 
    if (profits_have_changed == true){
        var oldnet = netprofits; 
        netprofits = ((grosswinnings / grosslosses ) * 100);
        netchange = oldnet - netprofits; 
        console.log("net profits have changed by " + netchange + " to " + netprofits); 
    } else { 
        console.log('net profits have not changed'); 
    }
    return netprofits; 
}

function summarize() { 
    if (verbose == true) { 
        console.log('============================================'); 
        console.log('==> Starting game... '); 
        console.log('==> Gross Winnings: ' + grosswinnings); 
        console.log('==> Gross Losses: ' + grosslosses); 
        console.log('==> Gain/Loss of ' + totalprofit); 
        console.log('==> # of games won: ' + numwinners); 
        console.log('==> # of games lost: ' + numlosers); 
        console.log('==> % of games won: ' + winrate + numlosers); 
        console.log('==> # of games elapsed: ' + gameselapsed); 
        console.log('============================================'); 

    } else { 
        console.log('starting new game -- wins: ' + numwinners + ' | losses: ' + numlosers + ' | grosswinnings: ' + grosswinnings + ' | grosslosses:' + grosslosses + " | totalprofit: " + totalprofit); 
    }

}

function cocallback(gamedata) { 
    console.log("Cashed out!"); 
} 


