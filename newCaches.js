/*     New Caches

Aluno 1: 59893 Diogo Costa
Aluno 2: 60722 Tomás Gabriel

Comment:

The file "newCaches.js" must include, in the first lines,
an opening comment containing: the name and number of the two students who
developd the project; indication of which parts of the work
made and which were not made; possibly alerts to some aspects of the
implementation that may be less obvious to the teacher.

Comment about points 5 and 6:
After reflecting for some time, my group reached the conclusion that the best way to
fill a "donut" with inner radius of 161m and outer radius of 400m with circles whose
radii do not touch each other was by trying to mimic a flower of life (rosácea in portuguese).
For that, we studied the distances in longitude and latitude and use trigonometric principles
to achieve the 18 possible circles that can be placed inside the donut.
A more ilustrative view of the matter can be view here: https://imgur.com/a/IqzCDsc.
In the linked image, the red circle is the radius of the center Cache, the blue circles are the radii of the caches 
that we are trying to add and the green circle represents the 400m radius of the center cache.
Moreover, to achieve the animation we used the setTimeout function. Each placeable cache
will have to wait at least 1ms to be placed.


0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference.html
*/



/* GLOBAL CONSTANTS */

const MAP_INITIAL_CENTRE =
	[38.661,-9.2044];  // FCT coordinates
const MAP_INITIAL_ZOOM =
	14
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
	"resources/";
const CACHE_KINDS = ["CITO", "Earthcache", "Event",
	"Letterbox", "Mega", "Multi", "Mystery", "Other",
	"Traditional", "Virtual", "Webcam", "Wherigo"];
const CACHE_RADIUS =
	161;  // meters
const MAX_CREATION_RADIOUS =
	400;  //meters
const CACHES_FILE_NAME =
	"caches.xml";
const STATUS_ENABLED =
	"E";
const PLACE_CIRCLE_COLOR=
	"green";
const TRAD_CIRCLE_COLOR=
	"red";
const USER_CIRCLE_COLOR=
	"lime";
const AUTO_CIRCLE_COLOR=
	"blue";
const NO_POPUP = "";
const LAT = 0;
const LNG = 1;

/* GLOBAL VARIABLES */

let map = null;

let offs;

let ownerList = [];

let maxOwner;
let maxCache;

/* USEFUL FUNCTIONS */
function updateMaxAltitude(){
	let elem = document.getElementById('highalt');
	elem.textContent = maxCache.code;
}

function incrStat(id, value){
	let elem = document.getElementById(id);
	value += parseInt(elem.textContent, 10);
	elem.textContent = value;
}

function toRad(deg) { return deg * 3.1415926535898 / 180.0; }

function getOffset(deg, lambda){
    //[latitude offset, longitude offset]
    let delta = 0.00190;
    let latCorrection = -0.0004;
    return [lambda*(delta+latCorrection)*Math.sin(toRad(deg)), lambda*delta*Math.cos(toRad(deg))];
}

function initOffs2layers(){
    offs = [
        getOffset(0, 1),
        getOffset(60, 1),
        getOffset(120, 1),
        getOffset(180, 1),
        getOffset(240, 1),
        getOffset(300, 1),
        getOffset(0, 2),
        getOffset(60, 2),
        getOffset(120, 2),
        getOffset(180, 2),
        getOffset(240, 2),
        getOffset(300, 2),
        getOffset(30, Math.sqrt(3)),
        getOffset(90, Math.sqrt(3)),
        getOffset(150, Math.sqrt(3)),
        getOffset(210, Math.sqrt(3)),
        getOffset(270, Math.sqrt(3)),
        getOffset(330, Math.sqrt(3))
    ];
}

//deg in degrees
function getNewCoords(pivotCache, offNum){
    let off = offs[offNum]
    return [parseFloat(pivotCache.latitude) + off[LAT], parseFloat(pivotCache.longitude) + off[LNG]];
}

async function placeNew(howMany){
    initOffs2layers();
    let howManyPlaced = 0;
    let isInfinite = howMany<0;
    for(let i=0; i<map.caches.length && ((howMany<=0 && isInfinite)||(howMany>0 && !isInfinite)); i++){
        let pivotCache = map.caches[i];
        if(pivotCache.kind === 'Traditional'){
            for(let offNum = 0; offNum<18; offNum++){
                let newC = getNewCoords(pivotCache, offNum);
                if(!map.invadesAnyCacheRadious(newC[LAT], newC[LNG], null)){
                    await new Promise(r => setTimeout(r, 1));
                    map.createCache(newC[LAT], newC[LNG], AUTO_CIRCLE_COLOR);
                    howManyPlaced++;
                    howMany--;
                }
                if(howMany<=0 && !isInfinite) break;
            }
        }
    }
    if(isInfinite) alert(howManyPlaced);
}

// Capitalize the first letter of a string.
function capitalize(str)
{
	return str.length > 0
			? str[0].toUpperCase() + str.slice(1)
			: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2)
{
    function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
    let dLat = toRad(lat2 - lat1), dLon = toRad (lon2 - lon1);
    let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
    let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    return 6372.8 * 2.0 * Math.asin (Math.sqrt(a));
}

function disableCacheAlteration(cache){
	let deletable;
	let movable;
	if(cache.isMovable())
		movable = `<button onclick="map.alterCoordinates(${cache.latitude}, ${cache.longitude})" >Alter Coords</button>`;
	else
		movable = `<button disabled>Alter Coords</button>`;

	if(cache.isDeletable())
		deletable = `<button onclick="map.removeCache(${cache.latitude}, ${cache.longitude})" >Delete</button>`;
	else
		deletable = `<button disabled set="disabled">Delete</button>`;
		return movable + deletable;
}

function loadXMLDoc(filename)
{
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.send();
	}
	catch(err) {
		alert("Could not access the local geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;	
}

function txt2xml(txt) {
	let parser = new DOMParser();
	return parser.parseFromString(txt,"text/xml");
}

function getAllValuesByTagName(xml, name)  {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name)  {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}

function kindIsPhysical(kind) {
	return kind === "Traditional" || kind === "Multicache" || kind === 'Mystery' || kind === 'Letterbox';
}

function isTraditional(kind){
	return kind === "Traditional";
}

class Owner{
	constructor(name){
		this.name = name;
		this.numOfCaches = 0;
	}

	incrCaches(value){
		this.numOfCaches += value;
	}

	static getNum(name){
		let idx = ownerList.findIndex(e => e.name === name);
		return ownerList[idx].numOfCaches;
	}

	static addToOwner(owner, value){
		let idx = ownerList.findIndex(e => e.name === owner);
		let updtOwner;
		if(idx === -1){
			updtOwner = new Owner(owner);
			updtOwner.numOfCaches = value;
			ownerList.push(updtOwner);
		}
		else{
			updtOwner = ownerList[idx];
			updtOwner.numOfCaches += value;
		}
			
		if(maxOwner === undefined){
			maxOwner = ownerList[0];
		}
		else if(updtOwner.numOfCaches > maxOwner.numOfCaches){
			maxOwner = ownerList[idx];
		}
		this.processMax();
	}

	static processMax(){
		let elem = document.getElementById('prolown');
		elem.textContent = maxOwner.name;
	}
}


/* POI CLASS + Cache CLASS */

class POI {
	constructor(xml) {
		this.decodeXML(xml);
	}

	decodeXML(xml) {
		if(xml === null)
			return;
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
	}

	installCircle(radius, color, popup) {
		let pos = [this.latitude, this.longitude];
		let style = {color: color, fillColor: color, weight: 1, fillOpacity: 0.1};
		let circle = L.circle(pos, radius, style);
		if( popup != NO_POPUP)
			circle.bindPopup(popup, {autoClose: true}).openPopup();
		this.circle = circle;
	}
}

function getSite(id, argument) {
	let url;
	switch(id){
		case "B1": url = "https://www.geocaching.com/geocache/" + argument; break;
		case "B2": url = " http://maps.google.com/maps?layer=c&cbll=" + argument; break;
		default: return;
	}
	window.open(url, "_blank");
}

class Cache extends POI {
	constructor(xml) {
		super(xml);
		this.installMarker();
		map.add(this.marker);
		if(isTraditional(this.kind)){
			this.installCircle(CACHE_RADIUS, TRAD_CIRCLE_COLOR, NO_POPUP);
			map.add(this.circle);
		}
		this.color = TRAD_CIRCLE_COLOR;
		this.dragMark = null;
	}

	isDeletable(){
		return false;
	}

	isMovable(){
		return (this.kind === "Mystery" || this.kind === "Multi" || this.kind === "Letterbox");
	}

	decodeXML(xml) {
		super.decodeXML(xml);
		this.code = getFirstValueByTagName(xml, "code");
		this.owner = getFirstValueByTagName(xml, "owner");
		this.altitude = getFirstValueByTagName(xml, "altitude");

		this.kind = getFirstValueByTagName(xml, "kind");
		this.size = getFirstValueByTagName(xml, "size");
		this.difficulty = getFirstValueByTagName(xml, "difficulty");
		this.terrain = getFirstValueByTagName(xml, "terrain");


		this.favorites = getFirstValueByTagName(xml, "favorites");
		this.founds = getFirstValueByTagName(xml, "founds");
		this.not_founds = getFirstValueByTagName(xml, "not_founds");
		this.state = getFirstValueByTagName(xml, "state");
		this.county = getFirstValueByTagName(xml, "county");

		this.publish = new Date(getFirstValueByTagName(xml, "publish"));
		this.status = getFirstValueByTagName(xml, "status");
		this.last_log = new Date(getFirstValueByTagName(xml, "last_log"));
	}

	installMarker() {
		let pos = [this.latitude, this.longitude];
		let marker = L.marker(pos, {icon: map.getIcon(this.kind)});
		marker
			.bindPopup('<b>'+ this.kind + '</b>' + ' Cache' + '<br>'
			+ `<button onclick="getSite('B1', '${this.code})')" id="B1" >Geocache</button>`
			+ `<button onclick="getSite('B2', '${pos[0]}'+ ',' + '${pos[1]}')" id="B2" >Maps</button>` + disableCacheAlteration(this))
			.openPopup().bindTooltip(this.name);
		this.marker = marker;
	}

	dragableMarker(){
		let pos = [this.latitude, this.longitude];
		let marker = L.marker(pos, {icon: map.getIcon(this.kind), draggable: true, autoPan: true});
		this.dragMark = marker
		map.remove(this.marker);
		map.add(this.dragMark);
	}

	restoreOldMarker(){
		map.remove(this.dragMark);
		map.add(this.marker);
		if(isTraditional(this.kind))
			map.add(this.circle);
	}

	changeCachePos(){
		this.latitude = this.dragMark.getLatLng().lat;
		this.longitude = this.dragMark.getLatLng().lng;
		map.remove(this.dragMark);
		this.installMarker();
		map.add(this.marker);
		if(isTraditional(this.kind)){
			this.installCircle(CACHE_RADIUS, this.color, NO_POPUP);
			map.add(this.circle);
		}
	}
}

/* TEMPORARY CLASS */

class Temporary extends Cache{
	constructor(xml, color) {
		super(xml);
		this.circle.setStyle({color: color, fillColor: color});
		map.add(this.circle);
		this.color = color;
	}

	isDeletable(){
		return true;
	}

	isMovable(){
		return true;
	}
}

class Place extends POI {
	constructor(name, pos) {
		super(null);
		this.name = name;
		this.latitude = pos[0];
		this.longitude = pos[1];
		this.installCircle(CACHE_RADIUS, PLACE_CIRCLE_COLOR, name);
		map.add(this.circle);	
	}
}


/* Map CLASS */

class Map {
	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		this.icons = this.loadIcons(RESOURCES_DIR);
		this.caches = [];
		this.tempCaches = [];
		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)	
			.setContent("You clicked the map at " + e.latlng.toString() + '<br>'
			+ `<button onclick="getSite('B2', '${e.latlng.lat},${e.latlng.lng}')" id="B2_map" >Maps</button>`
			+ this.disableCacheCreation(`${e.latlng.lat}`, `${e.latlng.lng}`)));
	}

	createCache(lat, lng, color){
		let owner = color==='blue'? 'CPU':'User';
		let txt =
		 `<cache>
		 <code>UNKNOWN</code>
		 <name>UNKNOWN</name>
		 <owner>${owner}</owner>
		 <latitude>${lat}</latitude>
		 <longitude>${lng}</longitude>
		 <altitude>-32768</altitude>
		 <kind>Traditional</kind>
		 <size>UNKNOWN</size>
		 <difficulty>1</difficulty>
		 <terrain>1</terrain>
		 <favorites>0</favorites>
		 <founds>0</founds>
		 <not_founds>0</not_founds>
		 <state>UNKNOWN</state>
		 <county>UNKNOWN</county>
		 <publish>2000/01/01</publish>
		 <status>E</status>
		 <last_log>2000/01/01</last_log>
		 </cache>`;
		let xml = txt2xml(txt);
		if(this.invadesAnyCacheRadious(lat, lng, null)){alert("Cache Can't be created because another one is already in it's place"); return;}
		this.tempCaches.push(new Temporary(xml, color));
		incrStat('Traditional', 1);
		Owner.addToOwner(owner, 1);
	}

	disableCacheCreation(lat, lng){
		if(this.hasEnoughRadious(lat, lng, null) && !this.invadesAnyCacheRadious(lat, lng, null))
			return `<button onclick="map.createCache('${lat}','${lng}', '${USER_CIRCLE_COLOR}')">Create Cache</button>`;
		else
			return `<button disabled>Create Cache</button>`;
	}

	hasEnoughRadious(lat, lng, self){
		for(let i = 0; i < this.caches.length; i++){
			let haversineMeters = haversine(this.caches[i].latitude, this.caches[i].longitude, lat, lng)*1000;
			if(haversineMeters <= MAX_CREATION_RADIOUS && this.caches[i] != self)
				return true;
		}
		return false;
	}
	//if isKindKnown is false, we have to discover the kind
	invadesAnyCacheRadious(lat, lng, self){
		let kind;
		if(self == null)
			kind = "Traditional";
		else
			kind = self.kind;
		for(let i = 0; i < this.caches.length; i++){
			if(haversine(this.caches[i].latitude, this.caches[i].longitude, lat, lng)*1000 < CACHE_RADIUS && this.caches[i] != self 
			&& kindIsPhysical(this.caches[i].kind) && kindIsPhysical(kind))
				return true;
		}
		for(let i = 0; i < this.tempCaches.length; i++){
			if(haversine(this.tempCaches[i].latitude, this.tempCaches[i].longitude, lat, lng)*1000 < CACHE_RADIUS && this.tempCaches[i] != self
			&& kindIsPhysical(this.tempCaches[i].kind) && kindIsPhysical(kind)){
				return true;
			}
		}
		return false;
	}

	findCache(lat, lng){
		for(let i = 0; i < this.caches.length; i++){
			if(this.caches[i].latitude == lat && this.caches[i].longitude == lng)
				return this.caches[i];
		}
		let i = map.findTempCaches(lat, lng);
		if(i == -1) return null; 
		else return map.tempCaches[i];
	}

	findTempCaches(lat, lng){
		for(let i = 0; i < this.tempCaches.length; i++){
			if(this.tempCaches[i].latitude == lat && this.tempCaches[i].longitude == lng){
				return i;
			}
		}
		return -1;
	}

	removeCache(lat, lng){
		let i = map.findTempCaches(lat, lng);
		if(i != -1){
			let cache = map.tempCaches[i];
			this.remove(cache.circle);
			this.remove(cache.marker);
			this.tempCaches.splice(i, 1);
			incrStat('Traditional', -1);
			return;
		}
		alert(`INTERNAL ERROR IN METHOD 'removeCache(${lat}, ${lng})'`);
	}

	alterCoordinates(lat, lng){
		let cache = map.findCache(lat, lng);
		if(cache==null){
			alert(`INTERNAL ERROR IN METHOD 'alterCoordinates(${lat}, ${lng})'`);
			return;
		}
		cache.dragableMarker();
		cache.dragMark.on('dragstart', function (e) {
			if(isTraditional(cache.kind))
				map.remove(cache.circle);
		})
		cache.dragMark.on('dragend', function (e) {
			let dragMarkPos = [];
			dragMarkPos[LAT] = cache.dragMark.getLatLng().lat;
			dragMarkPos[LNG] = cache.dragMark.getLatLng().lng;
			if(map.invadesAnyCacheRadious(dragMarkPos[LAT], dragMarkPos[LNG], cache)
			|| !map.hasEnoughRadious(dragMarkPos[LAT], dragMarkPos[LNG], cache)){
				cache.restoreOldMarker();
			}
			else {
				cache.changeCachePos();
			}
		})
	}

	populate() {
		this.caches = this.loadCaches(RESOURCES_DIR + CACHES_FILE_NAME);
	}

	showFCT() {
		this.fct = new Place("FCT/UNL", MAP_INITIAL_CENTRE);
	}

	getIcon(kind) {
		return this.icons[kind];
	}

	getCaches() {
		return this.caches;
	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
					minZoom: 6,
					maxZoom: 19,
					errorTileUrl: errorTileUrl,
					id: spec,
					tileSize: 512,
					zoomOffset: -1,
					attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for(let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.scale({maxWidth: 150, metric: true, imperial: false})
									.setPosition("topleft").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8], // marker's location
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for(let i = 0 ; i < CACHE_KINDS.length ; i++) {
			iconOptions.iconUrl = dir + CACHE_KINDS[i] + ".png";
			iconOptions.shadowUrl = dir + "Alive.png";
			icons[CACHE_KINDS[i]] = L.icon(iconOptions);
			iconOptions.shadowUrl = dir + "Archived.png";
			icons[CACHE_KINDS[i] + "_archived"] = L.icon(iconOptions);
		}
		return icons;
	}

	processCaches(xmlDoc) {
		let xs = getAllValuesByTagName(xmlDoc, "cache"); 
		let caches = [];
		if(xs.length === 0)
			alert("Empty cache file");
		else {
			for(let i = 0 ; i < xs.length ; i++)  // Ignore the disables caches
				if( getFirstValueByTagName(xs[i], "status") === STATUS_ENABLED )
					caches.push(new Cache(xs[i]));
		}
		return caches;
	}

	loadCaches(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "cache"); 
		let caches = [];
		
		if(xs.length === 0)
			alert("Empty cache file");
		else {
			let newCache;
			for(let i = 0 ; i < xs.length ; i++)  // Ignore the disables caches
				if( getFirstValueByTagName(xs[i], "status") === STATUS_ENABLED ){
					newCache = new Cache(xs[i]);
					if(maxCache === undefined)
						maxCache = newCache;
					else if(maxCache.altitude < newCache.altitude)
						maxCache = newCache;
					caches.push(newCache);
					Owner.addToOwner(newCache.owner, 1);
					incrStat(newCache.kind, 1);
				}
			updateMaxAltitude();
		}
		return caches;
	}

	add(marker) {
		marker.addTo(map.lmap);
	}

	remove(marker) {
		marker.remove();
	}

	addClickHandler(handler) {
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}
}


/* Some FUNCTIONS are conveniently placed here to be directly called from HTML.
   These functions must invoke operations defined in the classes, because
   this program must be written using the object-oriented style.
*/

function onLoad()
{
	map = new Map(MAP_INITIAL_CENTRE, MAP_INITIAL_ZOOM);
	map.showFCT();
	map.populate();
}



