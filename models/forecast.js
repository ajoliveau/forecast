const mongoose = require('mongoose');

let forecastSchema = new mongoose.Schema({
    date: Date,
    temp: Number,
    city: String,
    website: String
});

let Forecast = mongoose.model('Forecast', forecastSchema);

module.exports = Forecast;