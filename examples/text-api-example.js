// process.js
// Send a document over to alchemy api to get shit out of it
//

var
	fs = require("fs"),
	path = require("path"),

	async = require("async"),
	_ = require("lodash"),

	AlchemyAPI = require("../index.js").AlchemyAPI;

var processDoc = function(key) {
	fs.readFile(path.join(__dirname, "doc.txt"), function(err, data) {
		console.log('Got content, making api call...');
		var r = new AlchemyAPI({ apiKey: key });

		async.series({
			entities: _.partial(_.bind(r.textEntities, r), data),
			concepts: _.partial(_.bind(r.textConcepts, r), data),
			keywords: _.partial(_.bind(r.textKeywords, r), data)
		}, function(err, res) {
			if (err) return console.log(err);

			console.log(res);
		});
	});
}

process.nextTick(function() {
	var key = process.argv[2];
	if (!key)
		return console.log('Please specify your API key as argument');

	processDoc(key);
});
