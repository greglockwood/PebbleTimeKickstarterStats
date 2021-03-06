/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui'),
    ajax = require('ajax'),
    Accel = require('ui/accel'),
    Vibe = require('ui/vibe');

Accel.init();

var loading = new UI.Card({
    title: 'Pebble Time',
    subtitle: 'Loading KickStarter Stats',
    body: 'Please wait...'
});

var stats = new UI.Card({scrollable: true, icon: 'IMAGES_KICKSTARTER_28X28_PNG'}),
    statsVisible = false,
    alreadyLoading = false,
    timeout,
    nextRun,
    historicalData = [];

var URL = 'https://www.kimonolabs.com/api/598l2duc?apikey=ZzOr54yaOxqxgm2lkZH2VMIeLw7H3X15';

function refresh(force, vibrate) {
    if (!force && (alreadyLoading || (nextRun && new Date() < nextRun))) {
        console.log('Refresh requested but ignored.');
        return;
    }
    loading.show();
    statsVisible = false;
    alreadyLoading = true;
    
    ajax({ url: URL, type: 'json' }, function (json) {
        console.log('Stats refreshed.', JSON.stringify(json));
        var statsData = json.results.pebble_time_stats[0];
        
        statsData = { backers: "??,???", total_raised: "$??,???,???" };
        
        historicalData.push({time: new Date(json.lastsuccess).getTime(), backers: toNum(statsData.backers), total_raised: toNum(statsData.total_raised)});
        nextRun = new Date(new Date(json.nextrun).getTime() + 90000);
        var timeToNext = nextRun.getTime() - new Date().getTime();
        stats.title(' Time Stats');
        stats.subtitle(statsData.total_raised + ' raised from');
        var refreshText = '\n\nLast refreshed at: ' + formatDate(new Date(json.thisversionrun)) + '\n\nShake to refresh, or it will be auto refreshed at ' + formatDate(nextRun) + '.';
        stats.body(statsData.backers + ' backers.' + historicalAnalysisText() + refreshText);
        loading.hide();
        if (vibrate) {
            Vibe.vibrate('short');
        }
        if (!statsVisible) {
            stats.show();
            statsVisible = true;
        }
        alreadyLoading = false;
        if (timeToNext > 0) {
            if (timeout) {
                window.clearTimeout(timeout);
            }
            timeout = window.setTimeout(createRefreshCallback(false, true), timeToNext);
        }
    },
    function (error) {
        console.error('Error fetching stats: ', error);
        alreadyLoading = false;
    });
}

function historicalAnalysisText() {
    if (historicalData.length > 1) {
        var firstEntry = historicalData[0],
            firstTime = firstEntry.time,
            lastEntry = historicalData[historicalData.length - 1],
            lastTime = lastEntry.time,
            minsElapsed = (lastTime - firstTime) / 60000,
            newBackers = lastEntry.backers - firstEntry.backers,
            money = lastEntry.total_raised - firstEntry.total_raised;
        console.log('Analysis figures: minsElapsed = ', minsElapsed, 'newBackers = ', newBackers, 'money = ', money, 'first entry = ', JSON.stringify(firstEntry), 'last entry = ', JSON.stringify(lastEntry));
        if (minsElapsed > 0) {
            return '\n\nSince opening the app, that is an average of ' + formatNum(newBackers / minsElapsed) + ' new backers and $' + formatNum(money / minsElapsed) + ' raised per minute!';
        }
    }
    return '';
}

function formatNum(n) {
    return '' + (Math.round(n * 10) / 10);
}

function toNum(str) {
    return parseInt((str || '').toString().replace(/[^\d]/g, ''), 10);
}

function createRefreshCallback(force, vibrate) {
    return function refresh_callback() {
        refresh(force, vibrate);
    };
}

refresh(true, false);

stats.on('click', 'select', createRefreshCallback(false, true));
Accel.on('tap', createRefreshCallback(true, true));

function formatDate(date) {
    return date.format('D H:i:s');
}

// Simulates PHP's date function
Date.prototype.format = function(format) {
    var returnStr = '';
    var replace = Date.replaceChars;
    for (var i = 0; i < format.length; i++) {       var curChar = format.charAt(i);         if (i - 1 >= 0 && format.charAt(i - 1) == "\\") {
            returnStr += curChar;
        }
        else if (replace[curChar]) {
            returnStr += replace[curChar].call(this);
        } else if (curChar != "\\"){
            returnStr += curChar;
        }
    }
    return returnStr;
};

Date.replaceChars = {
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Day
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    D: function() { return Date.replaceChars.shortDays[this.getDay()]; },
    j: function() { return this.getDate(); },
    l: function() { return Date.replaceChars.longDays[this.getDay()]; },
    N: function() { return this.getDay() + 1; },
    S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
    w: function() { return this.getDay(); },
    z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
    // Week
    W: function() { var d = new Date(this.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
    // Month
    F: function() { return Date.replaceChars.longMonths[this.getMonth()]; },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    M: function() { return Date.replaceChars.shortMonths[this.getMonth()]; },
    n: function() { return this.getMonth() + 1; },
    t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate(); }, // Fixed now, gets #days of date
    // Year
    L: function() { var year = this.getFullYear(); return (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)); },   // Fixed now
    o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    // Time
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
    g: function() { return this.getHours() % 12 || 12; },
    G: function() { return this.getHours(); },
    h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
'0' : '')) + m; },
    // Timezone
    e: function() { return "Not Yet Supported"; },
    I: function() {
        var DST = null;
            for (var i = 0; i < 12; ++i) {
                    var d = new Date(this.getFullYear(), i, 1);
                    var offset = d.getTimezoneOffset();

                    if (DST === null) DST = offset;
                    else if (offset < DST) { DST = offset; break; }                     else if (offset > DST) break;
            }
            return (this.getTimezoneOffset() == DST) | 0;
        },
    O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
    P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
    T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
    Z: function() { return -this.getTimezoneOffset() * 60; },
    // Full Date/Time
    c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
    r: function() { return this.toString(); },
    U: function() { return this.getTime() / 1000; }
};