const express = require('express');
const bodyParser = require('body-parser');
const got = require('got');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const keepAliveAgent = new (require('https')).Agent({
	keepAlive: true
});

const TKN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJTYWZlU2l6ZS9zdGFnZSIsImV4cCI6MTYxMDk4MjcyMCwiYXVkIjoiUk9MRV9FV0VCIiwic3ViIjoic2FmZXNpemVUZXN0MTAiLCJwZHQiOiI1cUVZdnpLcDd0NWtLTkl1M0NUd2VHQTFpbEZ2NTBaWjhWQ1JFVk92SVo2TW5DYUxCK0ZjazN4eVJ1SnFjdStTNGZkOFJWSDdpNzV1Q1IzaTc4U1RnR3F1djZzeHV6Q3l1RlJVc05IWG5keFVCRnhOM295SlBiREcwWGRNV0l6OW52WjRCRWM0M2NQeEJaYXpXUVZJNlQ2d3RCSFhMNmU0RXBkZHBEd3F2dmR6TS9xWW5RVGtEcENrdktDWmhwMG0iLCJwcmlhcyI6IjkwMTAzIiwidGVuYW50IjoiOTAxMDMifQ.aku_MAwsrdzmRNWRkO8HToSNbWT6VHTeYjxijvFwryA'
const KEY = 456233;

const client = got.extend({
	prefixUrl: 'https://bmypmiaiwj.execute-api.eu-west-1.amazonaws.com/service02',
	searchParams: {
		tkn: TKN,
		key: KEY,
		limit: 99
	},
	agent: {
        https: keepAliveAgent
    },
	responseType: 'json'
});


async function getDevices(startDate, endDate) {
	let searchParams = {
		type: 'logID',
		id: 'SUM#DAILY',
		startTime: startDate,
		endTime: endDate
	};
	
	let resJson = await client.get('v1/test/dyndb', { searchParams }).json();

	let matchDev = {}
	resJson.forEach(obj => {
		let dayDevice = matchDev[obj.amt] = {};
		for (const [k, v] of Object.entries(obj)) {
			if (!k.startsWith('md:'))
				continue;
			let device = k.substring(k.indexOf('#') + 1);
			dayDevice[device] = (dayDevice[device] || 0) + v;
		}
	});
	
	return matchDev;
	
}


async function getIDs(device, date) {
	let startTime = Date.UTC(date.substr(0, 4), date.substr(4, 2) - 1, date.substr(6)),
		endTime = startTime + 86400000 - 1;

	let searchParams = {
		type: 'logDEVICE',
		id: device,
		startTime,
		endTime
	};

	return await client.get('v1/test/dyndb', { searchParams }).json();
}

/* 
parametri 
type=log, logID
id={recommendation ID}, 
startTime, 
endTime 
*/

async function getShoe(id, date) {
	let startTime = Date.UTC(date.substr(0, 4), date.substr(4, 2) - 1, date.substr(6)),
		endTime = startTime + 86400000 - 1;

	let searchParams = {
		type: 'logID',
		id: id,
		startTime,
		endTime
	};
	
	return await client.get('v1/test/dyndb', { searchParams }).json();
	
}
function compare( a, b ) {
	if ( a.amt < b.amt ){
		return -1;
	}
	if ( a.amt > b.amt ){
		return 1;
	}
	return 0;
}

(async () => {
	try {
		//1.korak
		var matchDev = await getDevices('20200513', '20201120');
		for (const date of Object.keys(matchDev).sort()) {
			let devices = matchDev[date];
			//2.korak in 3.korak
			for (const dev in devices) {
				const recommendation = await getIDs(dev, date);
				const res = await getShoe(recommendation[0].id, date);
				const sorted = res.sort( compare );
				const sortedToString = JSON.stringify(sorted)
				fs.appendFile('shoes.txt', sortedToString, function (err) {
					if (err) throw err;
				});
			}

		}

	} catch (err) {
		console.error(err);
	}
})();

app.listen (port, error => {
    if(error) throw error;
    console.log('App listening on port ' + port);
});