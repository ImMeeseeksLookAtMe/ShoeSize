/*jshint esversion: 8 */
const got = require('got');

const keepAliveAgent = new (require('https')).Agent({
	keepAlive: true
});

const TKN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJTYWZlU2l6ZS9zdGFnZSIsImV4cCI6MTYxMDk4MjcyMCwiYXVkIjoiUk9MRV9FV0VCIiwic3ViIjoic2FmZXNpemVUZXN0MTAiLCJwZHQiOiI1cUVZdnpLcDd0NWtLTkl1M0NUd2VHQTFpbEZ2NTBaWjhWQ1JFVk92SVo2TW5DYUxCK0ZjazN4eVJ1SnFjdStTNGZkOFJWSDdpNzV1Q1IzaTc4U1RnR3F1djZzeHV6Q3l1RlJVc05IWG5keFVCRnhOM295SlBiREcwWGRNV0l6OW52WjRCRWM0M2NQeEJaYXpXUVZJNlQ2d3RCSFhMNmU0RXBkZHBEd3F2dmR6TS9xWW5RVGtEcENrdktDWmhwMG0iLCJwcmlhcyI6IjkwMTAzIiwidGVuYW50IjoiOTAxMDMifQ.aku_MAwsrdzmRNWRkO8HToSNbWT6VHTeYjxijvFwryA';
const KEY = 456233;

const client = got.extend({
	prefixUrl: 'https://bmypmiaiwj.execute-api.eu-west-1.amazonaws.com/service02',
	searchParams: {
		tkn: TKN,
		key: KEY
	},
	agent: keepAliveAgent,
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



(async () => {
	try {
		var matchDev = await getDevices('20200513', '20201120');
		console.log('result', matchDev);
		for (const date of Object.keys(matchDev).sort()) {
			let devices = matchDev[date];


			for (const dev in devices) {
				console.log(dev, date);
			}	

		}
	} catch (err) {
		console.error(err);
	}
})();

