// process.js
// Send a document over to alchemy api to get shit out of it
//

var
	http = require("http"),
	querystring = require("querystring"),
	
	_ = require("lodash"),
	async = require("async");

var AlchemyAPI = function(options) {
	this.options = _.defaults(options || {}, {});

	var types = ["text", "url", "html"];
	var o = this;

	_.each(types, function(t) {
		o[t + "Concepts"] = _.partial(_.bind(o.makeCall, o), t, "concepts", "GetRankedConcepts");
		o[t + "Keywords"] = _.partial(_.bind(o.makeCall, o), t, "keywords", "GetRankedKeywords");
		o[t + "Entities"] = _.partial(_.bind(o.makeCall, o), t, "entities", "GetRankedNamedEntities");
		o[t + "Sentiment"] = _.partial(_.bind(o.makeCall, o), t, "docSentiment", "GetTextSentiment");
	});
}

AlchemyAPI.prototype.makeCall = function(type, extractWhat, name, data, cb) {
	var o = this;
	var prefix = (/(html|url)/.test(type) ? type.toUpperCase() : (
		/text/.test(type) ? 'Text' : null));

	if (!prefix)
		throw new Error('The type parameter can only be html, url or text');

	var postData = type + "=" + escape(data);
	var qs = querystring.stringify({
		apikey: o.options.apiKey,
		outputMode: 'json'
	});

	var options = {
		host: "access.alchemyapi.com",
		port: 80,
		path: "/calls/" + type + "/" + prefix + name + "?" + qs,
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": _.size(postData)
		}
	};

	var r = http.request(options, function(res) {
		if (res.statusCode / 100 != 2) return cb(new Error('Invalid HTTP response code: ' + res.statusCode));

		var d = "";
		res.on('data', function(data) {
			d = d + data.toString();
		});

		res.on('end', function(data) {
			var obj = JSON.parse(d);

			if (obj.status == 'ERROR')
				return cb(new Error('AlchemyAPI returned Error: ' + (obj.statusInfo || 'unknown')));

			cb(null, obj[extractWhat]);
		});
	});

	r.on('error', cb);

	r.write(postData);
	r.end();
}

module.exports.AlchemyAPI = AlchemyAPI;
