var csv = require('csv');
var fs = require('fs');
var dateformat = require('dateformat');

let file = fs.readFileSync('LV_BernhardFuchs_Export_07-09-2018.csv').toString();
let lines = file.split('\r\n');
let perhour = 3600 * 1000;
let perday = 24 * perhour;



function splitByComma(str) {
    //split the str first  
    //then merge the elments between two double quotes  
    var delimiter = ',';
    var quotes = '"';
    var elements = str.split(delimiter);
    var newElements = [];
    for (var i = 0; i < elements.length; ++i) {
        if (elements[i].indexOf(quotes) >= 0) { //the left double quotes is found  
            var indexOfRightQuotes = -1;
            var tmp = elements[i];
            //find the right double quotes  
            for (var j = i + 1; j < elements.length; ++j) {
                if (elements[j].indexOf(quotes) >= 0) {
                    indexOfRightQuotes = j;
                }
            }
            //found the right double quotes  
            //merge all the elements between double quotes  
            if (-1 != indexOfRightQuotes) {
                for (var j = i + 1; j <= indexOfRightQuotes; ++j) {
                    tmp = tmp + delimiter + elements[j];
                }
                newElements.push(tmp);
                i = indexOfRightQuotes;
            } else { //right double quotes is not found  
                newElements.push(elements[i]);
            }
        } else { //no left double quotes is found  
            newElements.push(elements[i]);
        }
    }

    return newElements;
}

function parseIe(str) {
    if (!str) {
        return 0;
    }
    return parseFloat(str.slice(1, -1).replace(',', '.'))
}

function parseGluc(data) {
    let type = parseInt(data[3])
    if (type > 1) {
        return null;
    }
    return parseInt(data[4 + type]);
}

function parseKh(kh) {
    if (!kh) {
        return 0;
    }
    return parseInt(kh);
}

function formatIe(ie) {
    if (!ie) {
        return "";
    }
    return ie;
}

function formatKh(kh) {
    if (!kh) {
        return "";
    }
    return Math.round(kh * 10 / 12) / 10;
}

function logDay(date, data, notes) {
    console.log("<div><h3>" + date + "</h3>");
    console.log("<table border><tr><th></th>");
    data.forEach(elem => {
        console.log("<th>" + elem.hour + "</th>");
    });
    console.log("</tr>");
    console.log("<tr bgcolor='#cccccc'><td>BZ</td>");
    data.forEach(elem => {
        console.log("<td>" + elem.gluc + "</td>");
    });
    console.log("</tr>");
    console.log("<tr><td>BE</td>");
    data.forEach(elem => {
        console.log("<td>" + formatKh(elem.kh) + "</td>");
    });
    console.log("</tr>");
    console.log("<tr bgcolor='#cccccc'><td>Basis</td>");
    data.forEach(elem => {
        console.log("<td>" + formatIe(elem.basal_ie) + "</td>");
    });
    console.log("</tr>");
    console.log("<tr><td>Bolus</td>");
    data.forEach(elem => {
        console.log("<td>" + formatIe(elem.bolus_ie) + "</td>");
    });
    console.log("<tr><td colspan=" + (data.length + 1) + "><table>");
    notes.forEach(elem => {
        console.log("<tr><td>" + elem.at + "</td><td>" + elem.text + "</td></tr>");
    });
    console.log("</table></tr></table></div>");
}

console.log('<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
<title>Test</title>\
<style type="text/css">\
  div { page-break-inside:avoid; }\
  table { page-break-inside:avoid; }\
  tr    { page-break-inside:avoid; page-break-after:auto }\
  thead { display:table-header-group }\
  tfoot { display:table-footer-group }\
</style>\
</head><body>');

var day_data = [];
var notes = [];

var lastday = 0;
var lastdate = "";
var lasthour = "";
var lastentry = [];
lines.forEach(line => {
    let data = splitByComma(line);
    if (data) {
        let source = data[0];
        if (source == 'FreeStyle LibreLink') {
            let entry = {
                date: Date.parse(data[2]),
                isscan: data[3],
                gluc: parseGluc(data),
                bolus_ie_unspec: data[6],
                bolus_ie: parseIe(data[7]),
                kh_unspec: data[8],
                kh: parseKh(data[9]),
                basal_ie_unspec: data[11],
                basal_ie: parseIe(data[12]),
                note: data[13]
            }
            let currentdate = dateformat(entry.date, "ddd dd.mm.yyyy HH:MM");
            let currentday = currentdate.substring(0, 14);
            let currenthour = parseInt(currentdate.substring(15, 17));
            if (currentday != lastday) {
                if (lastday != 0) {
                    logDay(lastday, day_data, notes);
                }

                day_data = [];
                notes = [];
                lastday = currentday;
                lasthour = "invalid";
            }

            if (entry.note) {
                notes.push({
                    at: currentdate.substring(15, 20),
                    text: entry.note
                });
            }

            if (lasthour != currenthour) {
                lasthour = currenthour;
                if (entry.gluc > 0) {
                    middle = Math.floor(entry.date / perhour) * perhour;
                    middle_gluc = Math.round(lastentry.gluc + (entry.gluc - lastentry.gluc) / (entry.date - lastentry.date) * (middle - lastentry.date));
                } else {
                    middle_gluc = -1;
                }

                //console.log("hour: " + currenthour);
                //console.log(lastdate + ": " + lastentry.gluc);
                //console.log(dateformat(middle, "dd-mm-yyyy HH:MM") + ": " + middle_gluc);
                //console.log(currentdate + ": " + entry.gluc);
                day_data[currenthour] = {
                    hour: currenthour,
                    gluc: middle_gluc,
                    basal_ie: entry.basal_ie,
                    bolus_ie: entry.bolus_ie,
                    kh: entry.kh
                };
            } else {
                if (day_data[currenthour].gluc < 0 && entry.gluc > 0) {
                    middle = Math.floor(entry.date / perhour) * perhour;
                    lasthour = currenthour;
                    day_data[currenthour].gluc = Math.round(lastentry.gluc + (entry.gluc - lastentry.gluc) / (entry.date - lastentry.date) * (middle - lastentry.date));
                }

                day_data[currenthour].basal_ie += entry.basal_ie;
                day_data[currenthour].bolus_ie += entry.bolus_ie;
                day_data[currenthour].kh += entry.kh;
            }

            if (entry.gluc > 0) {
                lastentry = entry;
            }
            lastdate = currentdate;

            //console.log(entry);
        }
    }
});

logDay(lastday, day_data, notes);

console.log("</table></body></html>");