var map = L.map('map').setView([51.52255, -0.10249], 13);
var options = {
  key: 'YOUR-API-KEY',
  limit: 10,
  proximity: '51.52255, -0.10249' // favour results near here
};
var control = L.Control.openCageSearch(options).addTo(map);
L.tileLayer('https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}{r}.png?apikey=72fe4d44ab5f4f689f94da1cc809ad2e', {
  attribution: 'Data <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Map tiles &copy; <a href="https://www.thunderforest.com/">Thunderforest</a>',
  minZoom: 4,
  maxZoom: 18
}).addTo(map);
