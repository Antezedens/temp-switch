const vm = require('vm');
const fs = require('fs');

var buf = fs.readFileSync('aes.js');

document = {};
location = {};

const script = new vm.Script(buf);
script.runInThisContext();
const script2 = new vm.Script('function toNumbers(d){var e=[];d.replace(/(..)/g,function(d){e.push(parseInt(d,16))});return e}function toHex(){for(var d=[],d=1==arguments.length&&arguments[0].constructor==Array?arguments[0]:arguments,e="",f=0;f<d.length;f++)e+=(16>d[f]?"0":"")+d[f].toString(16);return e.toLowerCase()}var a=toNumbers("f655ba9d09a112d4968c63579db590b4"),b=toNumbers("98344c2eee86c3994890592585b49f80"),c=toNumbers("3d843f9be39f20aaa5723c3d52a79ec9");document.cookie="__test="+toHex(slowAES.decrypt(c,2,a,b))+"; expires=Thu, 31-Dec-37 23:55:55 GMT; path=/"; location.href="http://fuchs.byethost11.com/sensor.php?i=1";');

script2.runInThisContext();

console.log("test: " + document.cookie);
