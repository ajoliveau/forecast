const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Forecast = require('./models/forecast');


const today = new Date();

(async () => {
	const browser = await puppeteer.launch({headless: true});
	const page = await browser.newPage();

	await page.setRequestInterceptionEnabled(true);
	page.on('request', request => {
		if (request.resourceType === 'Image')
			request.abort();
		else {
			// console.log(`Intercepting: ${request.method} ${request.url}`);
			request.continue();
		}
	});

	await page.goto('https://www.meteomedia.com/ca/previsions-meteo-horaires/quebec/montreal', {waitUntil: 'networkidle'});

	
	let hours = await page.evaluate(() => {
		var hours = [];
		var today = new Date();
		var dateField = $('#hourly > div > h2').text();
		var dateText = dateField.substring(0, dateField.indexOf('-')) + '2017 ';
		var hoursWrapper = $('#highcharts-0 > span:nth-child(4) > div.label-wrapper');
		hoursWrapper.children().each(function(i, hour) {
			var hourObject = {};
			var hourText = $(hour).find('.time').get(0).childNodes[1].textContent.slice(0, -1);
			var completeDateString = dateText + hourText + ':00:00';
			var date = new Date(completeDateString);
			if (i != 0 && hours[i - 1]['datetime'] >= date ) {
				console.log('Jour suivant !');
				date.setDate(date.getDate() + 1);
			}
		
			hourObject['datetime'] = date;
			hours[i] = hourObject;
		});

		return hours;
	});

	// for (var i = 1; i <= 7; i++) {
	// 	days[i - 1] = await page.evaluate((i) => {
	// 		var day = $('.day_' + i + ' > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)').text();
	// 		return {
	// 			day: day.substr(0, day.indexOf(' ')),
	// 			temp: $('.day_' + i + ' .chart-daily-temp').get(0).childNodes[0].textContent.trim()
	// 		}
	// 	}, i);
	// }

	// days.forEach((day) => {
	// 	let date;
	// 	if (day.day >= today.getDate())
	// 		date = new Date(today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + day.day);
	// 	else
	// 		date = new Date(today.getFullYear() + '-' + (today.getMonth() + 2) + '-' + day.day);
	// 	upsertForecast({
	// 		website: 'meteomedia',
	// 		temp: day.temp,
	// 		date: date,
	// 		city: 'Montréal'
	// 	});
	// });''


	// console.log(days);
	mongoose.connection.close();
	// browser.close();
})();


function upsertForecast(forecastObj) {
	
	const DB_URL = 'mongodb://localhost/forecast';

	if (mongoose.connection.readyState == 0) { mongoose.connect(DB_URL, {useMongoClient: true}); }

	// if this email exists, update the entry, don't insert
	let conditions = { date: forecastObj.date, website: forecastObj.website };
	let options = { upsert: true, new: true, setDefaultsOnInsert: true };

	Forecast.findOneAndUpdate(conditions, forecastObj, options, (err, result) => {
		if (err) throw err;
	});
}