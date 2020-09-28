//controls

const closeBtn = document.getElementById("close-botton");
const sectorStats = document.getElementById("sector-stats");

//map

const latitudeDefault = 39.399;
const longitudeDefault = -0.330;
const zoomDefault = 12;

const mymap = L.map("mapid").setView([latitudeDefault, longitudeDefault], zoomDefault);

//controls events

closeBtn.addEventListener("click", ()=>{
    
    setViewTo(latitudeDefault, longitudeDefault, zoomDefault);
    displayCloseBtn(false);
    displaySectorStats(false);

});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(mymap);


//Get Json data


let requestJson = new XMLHttpRequest();

requestJson.open("GET", "../data/datos_aguas_vlc.json", false);

requestJson.send();

const data = JSON.parse(requestJson.responseText);

//Get GeoJson data

var requestGeoJson = new XMLHttpRequest();

requestGeoJson.open("GET", "../data/sectores.geojson", true);

requestGeoJson.send();

requestGeoJson.onreadystatechange = function(){
    
    if(this.readyState == 4 && this.status == 200){

        let geoData = JSON.parse(this.responseText);
        
        createGeoLayer(geoData);

    }

}

//Create layers

function createGeoLayer(geoData){
    
    //adding geojson layer
    let layers = L.geoJSON(geoData);
    layers.eachLayer((layer)=>{
        layer.setStyle({
            color:"red",
            fillColor:"#a1eb34",
            stroke:true,
            opacity:0.2,
            fillOpacity: 0.7
        });
        L.DomEvent.on(layer, "click", (e)=>{
            setViewTo(layer.getCenter()["lat"], layer.getCenter()["lng"]-0.02, 13.5);
            displayCloseBtn(true);
            displaySectorStats(true);
        });
        L.DomEvent.on(layer, "mouseover", (e)=>{
            layer.setStyle({
                fillOpacity: 1
            });
        });
        L.DomEvent.on(layer, "mouseout", (e)=>{
            layer.setStyle({
                fillOpacity: 0.7
            });
        });
    });
    layers.addTo(mymap);

}

//Animation

function setViewTo(lat, long, zoom){
    mymap.flyTo([lat, long], zoom, {
        animate: true,
        duration: 0.2
    })
}

//show close-botton

function displayCloseBtn(show){
    if(show){
    
        closeBtn.style.display = "block";

    }else{

        closeBtn.style.display = "none";

    }
}
function displaySectorStats(show){
    if(show){
    
        sectorStats.style.display = "block";

    }else{

        sectorStats.style.display = "none";

    }

}
