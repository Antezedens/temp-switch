const fs = require('fs');
const request = require('request');
function postrequest(laterfile, postdata, attempt) {
	try {
		cookie = fs.readFileSync('/tmp/cookie.txt');
	}
	catch(err) {
		cookie = "";
	}
	request({ 
		url: 'http://bernhard:fuchshaus@10.5.5.1/sensor',
		method: 'POST',
		auth: 'bernhard:fuchshaus',
		json: postdata,
		headers: {
			'Cookie': cookie
		}

	}, function (error, response, body) {
		if (error) {
			console.log("error: " + error);
			fs.writeFileSync(laterfile, JSON.stringify(postdata));
		} else {

		  console.log(response);
		if (response.body && response.body.indexOf('requires Javascript to work') > 0 && attempt < 1) {
			console.log(response.body);
			var scriptregex = /<script>(.*)<\/script>/g;
			match = scriptregex.exec(response.body);
			//match2 = scriptregex.exec("asdads<script>console.log('das ist ein test');</script>");
			console.log(match);
			//console.log(match2);
			if (match != null) {
				const vm = require('vm');
				const buf = fs.readFileSync('aes.js');
				const script = new vm.Script(buf);
				const script2 = new vm.Script(match[1]);
				document = {};
				location = {};
				script.runInThisContext();
				script2.runInThisContext();
				fs.writeFileSync("/tmp/cookie.txt", document.cookie);
				postrequest(laterfile, postdata, 1);
			}
		}
	  }
	});
}
exports.postrequest = postrequest;
