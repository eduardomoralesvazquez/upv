//chart var

var chart = null;

//mobile check

const mobile = mobileCheck();

//controls

const closeBtn = document.getElementById("close-botton");
const sectorStats = document.getElementById("sector-stats");
const view1 = document.getElementById("view-1")
const view2 = document.getElementById("view-2")
const view3 = document.getElementById("view-3")

//Stats

let sectorLocation = document.getElementById("sector-location");
let sectorId = document.getElementById("sector-id");
let sectorAvg = document.getElementById("sector-avg");
let sectorMedian = document.getElementById("sector-median");
let sectorMax = document.getElementById("sector-max");
let sectorMin = document.getElementById("sector-min");
let sectorTD = document.getElementById("sector-td");
let sectorQ1 = document.getElementById("sector-q1");
let sectorQ3 = document.getElementById("sector-q3");
let ctx = document.getElementById("chart").getContext("2d");
let btnBoxplot = document.getElementById("btn-boxplot");
let sectorBtn = document.getElementById("sector-btn");
let fechaBtn = document.getElementById("fecha-btn");

sectorBtn.addEventListener("click", (e)=>{changeBoxplot(e)})
fechaBtn.addEventListener("click", (e)=>{changeBoxplot(e)})

//map

let load = setInterval(()=>{
    if(readyData && readyGeoData){
        document.getElementById("load-screen").classList.add("hide")
        clearInterval(load);
    }
}, 50);

let readyData = false;
let readyGeoData = false;
var currentView = 1;
var activeLayer = null;
var activeLayers = [];
let layers;
const latitudeDefault = 39.394;
const longitudeDefault = -0.349;
var zoomDefault = 12;

if(mobile){

    zoomDefault =  12.5;

}else{

    zoomDefault = 12;

}

const mymap = L.map("mapid").setView([latitudeDefault, longitudeDefault], zoomDefault);

//controls events

closeBtn.addEventListener("click", ()=>{
    
    setViewTo(latitudeDefault, longitudeDefault, zoomDefault);
    displayCloseBtn(false);
    displaySectorStats(false);
    activeLayer = null;
    layers.eachLayer((layerb)=>{
        layerb.setStyle({
            fillOpacity:0.7
        });
    })

});

view1.addEventListener("click", ()=>{ changeView(1)});
view2.addEventListener("click", ()=>{ changeView(2)});
view3.addEventListener("click", ()=>{ changeView(3)});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(mymap);


//Get Json data

let data = null;
let maxResul = null;

let requestJson = new XMLHttpRequest();

requestJson.open("GET", "../data/datos_aguas_vlc.json", true);

requestJson.send();

requestJson.onreadystatechange = function(){

    if(this.readyState == 4 && this.status == 200){
        
        readyData = true;
        data = JSON.parse(this.responseText);

        data[0].map((e)=>{
            e.Ubicacion = parseInt(e.Ubicacion.match("[P][0-9]{3}")[0].substr(1,));
            e.Fecha = parseDate(e.Fecha);
        });
        maxResul = data[0].reduce((a,b)=>{
            if(a["Resultado (log)"] == undefined){
                return b;
            }else{
                if(a["Resultado (log)"]<b["Resultado (log)"]){
                    return b;
                }else{
                    return a;
                }
            }
        });
        drawTimeLine();

    }

}

//Get GeoJson data

let geoData = null;

let requestGeoJson = new XMLHttpRequest();

requestGeoJson.open("GET", "../data/sectores.geojson", true);

requestGeoJson.send();

requestGeoJson.onreadystatechange = function(){
    
    if(this.readyState == 4 && this.status == 200){

        readyGeoData = true;
        geoData = JSON.parse(this.responseText);
        
        createGeoLayer(geoData);

    }

}

//Create layers

function createGeoLayer(geoData){
    
    //adding geojson layer
    layers = L.geoJSON(geoData);
    layers.eachLayer((layer)=>{
        layer.setStyle({
            color:"red",
            fillColor:"rgb(0,255,0)",
            stroke:true,
            opacity:0.2,
            fillOpacity: 0.7
        });
        L.DomEvent.on(layer, "click", (e)=>{
            activeLayer = layer;
            displaySectorStats(true);
            if(currentView == 1){
                setViewTo(layer.getCenter()["lat"], layer.getCenter()["lng"]-0.045, 13.5);
                drawStats(layer);
                displayCloseBtn(true);
                layer.setStyle({
                        fillOpacity:1
                });
            }
            if( currentView != 3){
                layers.eachLayer((layerb)=>{
                    if(layerb != activeLayer){
                  
                        layerb.setStyle({
                        fillOpacity:0.7
                        });

                    }
                });
            }
            if(currentView == 3){
                if(activeLayers.includes(layer.feature.id)){
                    removeDataToChart(layer.feature.id);
                    activeLayers = activeLayers.filter((e)=>{

                        if(e != layer.feature.id)
                            return true;
                
                        return false;
                
                    });
                }else{

                    let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
                    sectorData = getDays().map((e)=>{
                        let dataDay = sectorData.filter((b)=>{return b.Fecha.getTime() == e});
                        if(dataDay.length){
                            return dataDay[0]["Resultado (log)"];
                        }else{
                            return null;
                        }
                    });
                    activeLayers.push(layer.feature.id);
                    addDataToChart(layer.feature.id, sectorData, layer.feature.id, layer.options.fillColor )

                }
            }
        });
        L.DomEvent.on(layer, "mouseover", (e)=>{
            layer.setStyle({
                fillOpacity: 1
            });
        });
        L.DomEvent.on(layer, "mouseout", (e)=>{
            if(currentView != 3){
                if(activeLayer!=layer)
                layer.setStyle({
                    fillOpacity: 0.7
                });
            }
        });
        
    });
    layers.bindTooltip(function (layer){
        return "sector: "+layer.feature.id;
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

//show sector Stats

function displaySectorStats(show){
    if(show){
    
        sectorStats.classList.remove("hide-stats");

    }else{

        sectorStats.classList.add("hide-stats");

    }

}

//mobile check function

function mobileCheck(){
    
    if( navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)){

        return true;

    }else{

        return false;

    }

}

//parse excel date to js date

function parseDate(excelDate){

    return new Date((excelDate - (25567 + 2))*86400*1000);

}

//draw stats

function drawStats(layer){
    
    if(chart!=null){
    
        chart.destroy();
        chart = null;

    }

    let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
    let results = sectorData.map((element)=>{ return element.Resultado;});
    let resultsLog = sectorData.map((element)=>{ return element["Resultado (log)"];});
    
    let dates = sectorData.map((element)=>{ return element.Fecha;});
    let media = getAvg(results);
    let median = getMedian(results);
    let tD= getTD(results);
    let q1= getQ1(results);
    let q3= getQ3(results);


    if(currentView == 1){

        sectorMax.innerHTML = "Maximo: "+ Math.max.apply(Math, results) +" UG/L";
        sectorMin.innerHTML = "Minimo: "+ Math.min.apply(Math, results) +" UG/L";
        sectorAvg.innerHTML = "Media: "+ media.toFixed(3) +" UG/L";
        sectorMedian.innerHTML = "Mediana: "+ median +" UG/L";
        sectorTD.innerHTML = "Desviación Tipica: "+ tD.toFixed(3) + " UG/L";
        sectorQ1.innerHTML = "Q1: "+ q1.toFixed(3) + " UG/L";
        sectorQ3.innerHTML = "Q3: "+ q3.toFixed(3) + " UG/L";
    
        sectorId.innerHTML = "ID: "+layer.feature.id;
        sectorLocation.innerHTML = layer.feature.properties.Descripcion;

        chart = new Chart(ctx, {

            type:"line",
            data: {
                labels:dates.map(date => new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric'}).format(date)),
                datasets: [
                    {
                        label: 'UG/L',
                        borderColor: 'red',
                        data: resultsLog
                    },
                    {
                        label: 'Media (General)',
                        borderColor: 'rgba(0,110,0,0.7)',
                        data: getGeneralAvg(sectorData)
                    },
                    {
                        label: 'Mediana (General)',
                        borderColor: 'rgba(0,0,210,0.7)',
                        data: getGeneralMedian(sectorData)
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: "Registro de RNV viral (SARS-Cov2019) por sectores (Log)",
                    fontSize: 20,
                    padding: 30
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 15,
                        fontFamily: 'sans-serif',
                        fontColor: 'black'
                    }
                },
                elements: {
                    line: {
                        borderWidth: 4,
                        fill: false
                    },
                    point: {
                        radius: 5,
                        borderWidth: 1,
                        backgroundColor: "white",
                        hoverRadius: 8,
                        hoverBorderWidth: 5
                    }
                }
            }
    
        });
    }
    
    
}

function drawChart2(){
    if(currentView == 2){

        chart = new Chart(ctx, {
        type: 'boxplot',
        data: {
            // define label tree
            labels: getSectorsId(),
            datasets: [{
              label: 'UG/L',
              backgroundColor: "#4287f5",
              borderColor: "#1a335c",
              borderWidth: 1,
              outlierColor: '#999999',
              padding: 10,
              itemRadius: 0,
              data: getSectorsData()
            }]
          },
        options: {
            legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                boxWidth: 15,
                fontFamily: 'sans-serif',
                fontColor: 'black'
            }
            },
            title: {
                display: true,
                text: "Registro de RNV viral (SARS-Cov2019) aguas General (Log)",
                fontSize: 20,
                padding: 30
            }
        }
        });

        
        results = data[0].map((e)=>{
            return e.Resultado;
        });
        sectorMax.innerHTML = "Maximo: "+ Math.max.apply(Math, results) +" UG/L";
        sectorMin.innerHTML = "Minimo: "+ Math.min.apply(Math, results) +" UG/L";
        sectorLocation.innerHTML = "Estadísticos Muestrales";
        sectorAvg.innerHTML = "Media: "+ getAvg(results).toFixed(3) +" UG/L";
        sectorMedian.innerHTML = "Mediana: "+ getMedian(results) +" UG/L";
        sectorTD.innerHTML = "Desviación típica: "+ getTD(results).toFixed(3) + " UG/L";
        sectorQ1.innerHTML = "Q1 : "+ getQ1(results).toFixed(3) + " UG/L";
        sectorQ3.innerHTML = "Q3 : "+ getQ3(results).toFixed(3) + " UG/L";

    }
}

function drawChart3(){
    let dates = getDays().map((e)=>{ return new Date(e)});
    if(currentView == 3){

        
            chart = new Chart(ctx, {

                type:"line",
                data: {
                    labels:dates.map(date => new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric'}).format(date)),
                    datasets: []
                },
                options: {
                    title: {
                        display: true,
                        text: "Comparar RNV viral (SARS-Cov2019) por sectores (Log)",
                        fontSize: 20,
                        padding: 30
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 15,
                            fontFamily: 'sans-serif',
                            fontColor: 'black'
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 2,
                            fill: false
                        },
                        point: {
                            radius: 3,
                            borderWidth: 1,
                            backgroundColor: "white",
                            hoverRadius: 6,
                            hoverBorderWidth: 2
                        }
                    }
                }
        
            });

    }
}

function getMedian(array){

    let copyArray = array;
    copyArray.sort((a,b)=>a-b);
    let length = copyArray.length;
    
    if(length == 1)
        return copyArray[0];

    if(length%2){
        return copyArray[Math.ceil(length/2)-1];
    }else{
        let median = (copyArray[length/2-1]+copyArray[length/2])/2;
        return median;
    }

}
function getQ1(array){
    
    let copyArray = array;
    copyArray.sort((a,b)=>a-b);
    let length = copyArray.length;

    if(length == 1)
        return copyArray[0];

    if(length*0.25%1){
        return copyArray[Math.ceil(length*0.25)-1];
    }else{
        let median = (copyArray[length*0.25-1]+copyArray[length*0.25])/2;
        return median;
    }

}

function getQ3(array){

    let copyArray = array;
    copyArray.sort((a,b)=>a-b);
    let length = copyArray.length;

    if(length == 1)
        return copyArray[0];

    if(length*0.75%1){
        return copyArray[Math.ceil(length*0.75)-1];
    }else{
        let median = (copyArray[length*0.75-1]+copyArray[length*0.75])/2;
        return median;
    }

}
function getAvg(array){

    return array.reduce((accu, current)=> accu+current)/array.length;

}

function getTD(array){

    let tD;
    let media = getAvg(array);
    let total = 0;
    array.forEach(element => {
        
        total += element**2;

    });
    tD = (total/(array.length))-media**2;
    return Math.sqrt(tD);

}


function getGeneralAvg(sector){

    let generalAvg = [];
    let dataPerDate = groupByDateSum();
    for(let i = 0; i<sector.length; i++){
        for(let f = 0; f<dataPerDate.length; f++){
            if(sector[i].Fecha.getTime() == dataPerDate[f].date.getTime()){
                generalAvg.push(dataPerDate[f].sum/dataPerDate[f].length);
            }
        }
    }
    return generalAvg;
    
}
function getGeneralMedian(sector){

    let generalMedian = [];
    let dataPerDate = groupByDateArray();
    for(let i = 0; i<sector.length; i++){
        for(let f = 0; f<dataPerDate.length; f++){
            if(sector[i].Fecha.getTime() == dataPerDate[f].date.getTime()){
                generalMedian.push(getMedian(dataPerDate[f].data));
            }
        }
    }
    return generalMedian;
    
}
function groupByDateSum(){
    
    let days = getDays();
    let same = [];
    let dataPerDate = [];
    let resultLogPerDate = [];

    for(let i = 0; i<days.length; i++){
    
        for(let f = 0; f<data[0].length; f++){
    
            if(days[i] == data[0][f].Fecha.getTime()){
    
                same.push(data[0][f]);
    
            }
    
        }

        dataPerDate[i] = same;
        same = [];
    
    }

    for(let i = 0; i<dataPerDate.length; i++){
        resultLogPerDate[i] = {
            sum: 0,
            date: dataPerDate[i][0].Fecha,
            length: dataPerDate[i].length
        };
        for(let f = 0; f<dataPerDate[i].length; f++){
            resultLogPerDate[i].sum += dataPerDate[i][f]["Resultado (log)"];
        }
    }

    return resultLogPerDate;

}
function groupByDateArray(){
    
    let days = getDays();
    let same = [];
    let dataPerDate = [];
    let resultLogPerDate = [];

    for(let i = 0; i<days.length; i++){
    
        for(let f = 0; f<data[0].length; f++){
    
            if(days[i] == data[0][f].Fecha.getTime()){
    
                same.push(data[0][f]);
    
            }
    
        }

        dataPerDate[i] = same;
        same = [];
    
    }
    for(let i = 0; i<dataPerDate.length; i++){
        resultLogPerDate[i] = {
            data: [],
            date: dataPerDate[i][0].Fecha,
            length: dataPerDate[i].length
        };
        for(let f = 0; f<dataPerDate[i].length; f++){
            resultLogPerDate[i].data.push(dataPerDate[i][f]["Resultado (log)"]);
        }
    }

    return resultLogPerDate;

}


function getColor(number, max){

    if(number != 0){
        let result = Math.trunc(number * 556 / max["Resultado (log)"]);
        r = 0;
        g = 0;
        if(result>255){
    
            g = Math.abs(result-555);
            r = 255
    
        }else{
    
            r = Math.abs(result);
            g = 255;
    
        }
        return "rgb("+r+","+g+",0)";
    }else{
        return "rgb(0,255,0)";
    }

}
//----------------------------------------------------Time Line

let table = document.getElementById("reproductor");
let current = 0;
let color = "#4287f5"
let n = null;
let generalDates = null;
let onPlay = null;
let onReverse = null;
let reverse = document.getElementById("reverse")
let play = document.getElementById("play");
let stopR = document.getElementById("stop");
let pause = document.getElementById("pause");
let step = document.getElementById("step");
let cells = null;
let speedTime = document.getElementById("speedTime");
let reproDate = document.getElementById("repro-date");

//Controls
speedTime.addEventListener("click", ()=>{

    if(onPlay != null){
        clearInterval(onPlay);
        onPlay = null;
        play.classList.toggle("hide");
        pause.classList.toggle("hide");
    }
    if(onReverse != null){
        clearInterval(onReverse);
        onReverse = null;
        play.classList.toggle("hide");
        pause.classList.toggle("hide");
    }

});
play.addEventListener("click", ()=>{playRep();});
pause.addEventListener("click", ()=>{pauseRep();});
stopR.addEventListener("click", ()=>{stopRep();})
reverse.addEventListener("click", ()=>{reverseRep();});
step.addEventListener("click", ()=>{stepRep()});

//draw barr

function drawTimeLine(){

    generalDates = getDays();
    n = generalDates.length;
    table.innerHTML = "";
    let content = `<tbody>
                <tr>`;

    for (let i = 0; i < n; i++) {

        content += `
            <td id='c${i}' meta='${generalDates[i]}'></td>
            `;

    }

    content += `</tr>
                </tbody>`;

    table.innerHTML = content;

    cells = document.querySelectorAll("td");

    for (let i = 0; i < cells.length; i++) {

        cells[i].addEventListener("click",(e) => playTo(e, color));

    }

}

function hideTimeLine(boolean){
    let repro = document.getElementById("repro-container");
    if(boolean){
        repro.classList.remove("hide");
    }else{
        repro.classList.add("hide");
    }
}
//get days

function getDays(){
    
    let days = [];
    data[0].map((element)=>{
        
        if(!days.includes(element.Fecha.getTime())){
            days.push(element.Fecha.getTime());
        }
        
    });
    return days;

}

//stop

function stopRep(){

    for (let i = 0; i < cells.length; i++) {

        cells[i].style.backgroundColor = null;
        
    }
    current = 0;
    if(onPlay != null){
        clearInterval(onPlay);
        onPlay = null;
        play.classList.toggle("hide");
        pause.classList.toggle("hide");
    }
    if(onReverse != null){
        clearInterval(onReverse);
        onPlay = null;
        play.classList.toggle("hide");
        pause.classList.toggle("hide");
    }
    reproDate.innerHTML = "";
    layers.eachLayer((layer) => {
                    
        layer.setStyle({
            color:"red",
            fillColor:"rgb(0,255,0)",
            stroke:true,
            opacity:0.2,
            fillOpacity: 0.7
        });
    
    });

}

//reverse

function reverseRep() {

    if(onReverse == null){

        if(onPlay != null){

            clearInterval(onPlay);
            onPlay = null;
            
        }else{
            
            play.classList.toggle("hide");
            pause.classList.toggle("hide");

        }
        
        if(current != n)
        document.getElementById("c"+parseInt(current)).style.backgroundColor = null;

        onReverse = setInterval(()=>{
            if(current>0){

                let cell = document.getElementById("c"+parseInt(current-1));
                cell.style.backgroundColor = null;
                layers.eachLayer((layer) => {

                    let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
                    let log = sectorData.filter((element) => {
                        if(element.Fecha.getTime() == cell.getAttribute("meta") ){
                            return true;
                        }else{
                            return false;
                        }
                    });
                    let sectorColor = null;
                    
                    if(log.length == 0){
                        sectorColor = "rgb(213,213,213)"
                    }else{
                        sectorColor = getColor(log[0]["Resultado (log)"],maxResul)
                    }
            
                    
                    layer.setStyle({
                        color:"red",
                        fillColor:sectorColor,
                        stroke:true,
                        opacity:0.2,
                        fillOpacity: 0.7
                    });
                
                });

                current--;                
                cell = document.getElementById("c"+parseInt(current));

                reproDate.innerHTML = new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric', year:'numeric'}).format(new Date().setTime(cell.getAttribute("meta")));

            }else{

                reproDate.innerHTML = "";
                current = 0;
                clearInterval(onReverse);
                onReverse = null;
                play.classList.toggle("hide");
                pause.classList.toggle("hide");
                layers.eachLayer((layer) => {
                    
                    layer.setStyle({
                        color:"red",
                        fillColor:"rgb(0,255,0)",
                        stroke:true,
                        opacity:0.2,
                        fillOpacity: 0.7
                    });
                
                });
            }
        }, 100*speedTime.value);

    }

}

//pause

function pauseRep(){

    if(onPlay!=null){
        clearInterval(onPlay);
        onPlay = null;
    }
    if(onReverse!=null){
        clearInterval(onReverse);
        onReverse = null;
    }
    play.classList.toggle("hide");
    pause.classList.toggle("hide");

}

function playTo(e, color) {

    for (let i = e.target.id.substring(1); i >= 0 ; i--){

        let cell = document.getElementById("c"+i);
        cell.style.backgroundColor = color;

    }
    for (let i = parseInt(e.target.id.substring(1))+1; i < n ; i++){

        let cell = document.getElementById("c"+i);
        cell.style.backgroundColor = null;

    }
    
    current = e.target.id.substring(1);

    let cell = document.getElementById("c"+current);
    layers.eachLayer((layer) => {

        let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
        let log = sectorData.filter((element) => {
            if(element.Fecha.getTime() == cell.getAttribute("meta") ){
                return true;
            }else{
                return false;
            }
        });
        let sectorColor = null;
        
        if(log.length == 0){
            sectorColor = "rgb(213,213,213)"
        }else{
            sectorColor = getColor(log[0]["Resultado (log)"],maxResul)
        }

        
        layer.setStyle({
            color:"red",
            fillColor:sectorColor,
            stroke:true,
            opacity:0.2,
            fillOpacity: 0.7
        });
    
    });
    reproDate.innerHTML = new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric', year:'numeric'}).format(new Date().setTime(cell.getAttribute("meta")));



}

function playRep(){

    onPlay = setInterval(()=>{
   
        if(current<n){
            let cell = document.getElementById("c"+current);
            cell.style.backgroundColor = color;
            layers.eachLayer((layer) => {

                let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
                let log = sectorData.filter((element) => {
                    if(element.Fecha.getTime() == cell.getAttribute("meta") ){
                        return true;
                    }else{
                        return false;
                    }
                });
                let sectorColor = null;
                
                if(log.length == 0){
                    sectorColor = "rgb(213,213,213)"
                }else{
                    sectorColor = getColor(log[0]["Resultado (log)"],maxResul)
                }
                
                layer.setStyle({
                    color:"red",
                    fillColor:sectorColor,
                    stroke:true,
                    opacity:0.2,
                    fillOpacity: 0.7
                });
            
            });
            
            reproDate.innerHTML = new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric', year:'numeric'}).format(new Date().setTime(cell.getAttribute("meta")));
            
            current++;
        }else{
            clearInterval(onPlay);
            onPlay = null;
            play.classList.toggle("hide");
            pause.classList.toggle("hide");
        }

    }, 100*speedTime.value);
    play.classList.toggle("hide");
    pause.classList.toggle("hide");

}

function stepRep(){

    if(current<n && onPlay == null){
        let cell = document.getElementById("c"+current);
        cell.style.backgroundColor = color;
        
        current++;
        layers.eachLayer((layer) => {

            let sectorData = data[0].filter((element)=>{ return element.Ubicacion == layer.feature.id; });
            let log = sectorData.filter((element) => {
                if(element.Fecha.getTime() == cell.getAttribute("meta") ){
                    return true;
                }else{
                    return false;
                }
            });
            let sectorColor = null;
            
            if(log.length == 0){
                sectorColor = "rgb(213,213,213)"
            }else{
                sectorColor = getColor(log[0]["Resultado (log)"],maxResul)
            }


            layer.setStyle({

                color:"red",
                fillColor:sectorColor,
                stroke:true,
                opacity:0.2,
                fillOpacity: 0.7

            });
        
        });            
        reproDate.innerHTML = new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric', year:'numeric'}).format(new Date().setTime(cell.getAttribute("meta")));

    }
}

//-------------------View Code

let markers = null;

function changeView(view){
    
    if(chart!=null){
        chart.destroy();
        chart = null;
    }

    fechaBtn.classList.remove("btn-actived");
    sectorBtn.classList.add("btn-actived");

    if(currentView != view){
        
        sectorMax.innerHTML = "";
        sectorMin.innerHTML = "";
        sectorAvg.innerHTML = "";
        sectorMedian.innerHTML = "";
        sectorTD.innerHTML = "";
        sectorId.innerHTML = "";
        sectorLocation.innerHTML = "";


    }
    displayCloseBtn(false);
    currentView = view;
    document.querySelector(".actived").classList.remove("actived");
    document.querySelector("#view-"+view).classList.add("actived");
    switch(currentView){
        case 1: 
            document.getElementById("sector-data").classList.remove("hide");
            if(markers != null){
                markers.eachLayer((icon)=>{
                    icon.remove();
                });
                markers = null;
            }
            layers.eachLayer((layer) => {
                layer.setStyle({
                    fillOpacity: 0.7
                });
            });
            changeMapColor("rgb(0,255,0)");
            setViewTo(latitudeDefault, longitudeDefault, zoomDefault);
            displaySectorStats(false);
            hideTimeLine(true);
            displayBtnBoxplot(false);
            break;

        case 2: 
            document.getElementById("sector-data").classList.remove("hide");
            displayBtnBoxplot(true);
            if(markers == null){
                let iconsLayers = [];
                layers.eachLayer((layer)=>{
                    let icon = L.divIcon({className: "sectorsId", html: layer.feature.id});  
                    let layerIcon = L.marker(layer.getCenter(), {icon:icon});
                    layerIcon.addTo(mymap);
                    iconsLayers.push(layerIcon);
                });
                markers = new L.layerGroup(iconsLayers);
            }
            stopRep();
            changeMapColor("#4287f5");
            hideTimeLine(false);
            displaySectorStats(true);
            setViewTo(latitudeDefault, longitudeDefault-0.11, zoomDefault);
            drawChart2();
            break;
        case 3: 
            stopRep();
            displayBtnBoxplot(false);
            if(markers == null){
                let iconsLayers = [];
                layers.eachLayer((layer)=>{
                    let icon = L.divIcon({className: "sectorsId", html: layer.feature.id});  
                    let layerIcon = L.marker(layer.getCenter(), {icon:icon});
                    layerIcon.addTo(mymap);
                    iconsLayers.push(layerIcon);
                });
                markers = new L.layerGroup(iconsLayers);
            }
            let counterColor = 0;
            layers.eachLayer((layer)=>{
                if(counterColor<colorArray.length){
                    layer.setStyle({
                        fillColor:colorArray[counterColor],
                        fillOpacity:1
                    });
                    counterColor++;
                }else{
                    alert("No hay suficientes colores para representar todas las graficas");
                }
            });
            setViewTo(latitudeDefault, longitudeDefault-0.11, zoomDefault);
            hideTimeLine(false);
            document.getElementById("sector-data").classList.add("hide");
            displaySectorStats(true);
            drawChart3();
            break;
    }
    

}
function changeMapColor(mapColor){

    layers.eachLayer((layer)=>{
        layer.setStyle({
            fillColor:mapColor,
        });
    });
}
function getSectorsId(){

    let arrayId = [];

    data[0].map((element) => {
        
        arrayId.push(element.Ubicacion);

    });

    arrayId = arrayId.filter((a,b,c)=>{ return c.indexOf(a) == b }).sort((a,b)=>a-b);

    return arrayId;

}

function getSectorsData(){
    let sectorsData = [];
    let sectorsId = getSectorsId();

    sectorsId.map((sectorId)=>{
        sectorsData.push(data[0].filter((element)=>{ return element.Ubicacion == sectorId;}));    
    });
    sectorsData = sectorsData.map((e) => {
        return e.map((eb)=>{
            return eb["Resultado (log)"]
        });
    });
    return sectorsData;
}

//-----------------------------------Chart method

var colorArray = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

function addDataToChart(label, data, id, color){

    chart.data.datasets.push({label: label, data: data, borderColor:color, id:id});
    chart.update();

}
function removeDataToChart(id){

    chart.data.datasets = chart.data.datasets.filter((e)=>{

        if(e.id != id)
            return true;

        return false;

    });
    chart.update();

}
function displayBtnBoxplot(boolean){

    if(boolean){
        btnBoxplot.classList.remove("hide");
    }else{
        btnBoxplot.classList.add("hide");
    }

}

function changeBoxplot(e){
    
    if(chart!=null){
        chart.destroy();
        chart = null;
    }
    e.target.classList.add("btn-actived");
    if(e.target == fechaBtn){

        sectorBtn.classList.remove("btn-actived");
        dataPerDate = [];
        dataPerDate = groupByDateArray().map((e)=>{
            return e.data;
        });
        let dates = getDays().map((e)=>{ return new Date(e)});
        if(currentView == 2){

            chart = new Chart(ctx, {
            type: 'boxplot',
            data: {
                // define label tree
                labels: dates.map(date => new Intl.DateTimeFormat('es-SP', {month:'short', day:'numeric'}).format(date)),
                datasets: [{
                label: 'UG/L',
                backgroundColor: "#4287f5",
                borderColor: "#1a335c",
                borderWidth: 1,
                outlierColor: '#999999',
                padding: 10,
                itemRadius: 0,
                data: dataPerDate
                }]
            },
            options: {
                legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    boxWidth: 15,
                    fontFamily: 'sans-serif',
                    fontColor: 'black'
                }
                },
                title: {
                    display: true,
                    text: "Registro de RNV viral (SARS-Cov2019) aguas General (Log)",
                    fontSize: 20,
                    padding: 30
                }
            }
            });

            
            results = data[0].map((e)=>{
                return e.Resultado;
            });
            sectorMax.innerHTML = "Maximo: "+ Math.max.apply(Math, results) +" UG/L";
            sectorMin.innerHTML = "Minimo: "+ Math.min.apply(Math, results) +" UG/L";
            sectorLocation.innerHTML = "Estadísticos Muestrales";
            sectorAvg.innerHTML = "Media: "+ getAvg(results).toFixed(3) +" UG/L";
            sectorMedian.innerHTML = "Mediana: "+ getMedian(results) +" UG/L";
            sectorTD.innerHTML = "Desviación típica: "+ getTD(results).toFixed(3) + " UG/L";
            sectorQ1.innerHTML = "Q1: "+ getQ1(results).toFixed(3) + " UG/L";
            sectorQ3.innerHTML = "Q3: "+ getQ3(results).toFixed(3) + " UG/L";
        }
    }else{

        fechaBtn.classList.remove("btn-actived");
        if(currentView == 2){

            chart = new Chart(ctx, {
            type: 'boxplot',
            data: {
                // define label tree
                labels: getSectorsId(),
                datasets: [{
                label: 'UG/L',
                backgroundColor: "#4287f5",
                borderColor: "#1a335c",
                borderWidth: 1,
                outlierColor: '#999999',
                padding: 10,
                itemRadius: 0,
                data: getSectorsData()
                }]
            },
            options: {
                legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    boxWidth: 15,
                    fontFamily: 'sans-serif',
                    fontColor: 'black'
                }
                },
                title: {
                    display: true,
                    text: "Registro de RNV viral (SARS-Cov2019) aguas General (Log)",
                    fontSize: 20,
                    padding: 30
                }
            }
            });

        }
    }
}