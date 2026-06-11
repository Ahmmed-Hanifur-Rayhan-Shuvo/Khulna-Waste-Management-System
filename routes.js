// routes.js - Khulna Locations, Blynk Config, AI Categories
const KHULNA_LOCATIONS = [
    {id:1,name:'Khulna University',lat:22.9015,lng:89.5012,type:'educational',address:'KU Campus, Khulna'},
    {id:2,name:'Khulna Medical College',lat:22.8125,lng:89.5645,type:'medical',address:'Sonadanga, Khulna'},
    {id:3,name:'Gollamari',lat:22.8345,lng:89.5412,type:'residential',address:'Gollamari, Khulna'},
    {id:4,name:'Sonadanga',lat:22.8345,lng:89.5512,type:'residential',address:'Sonadanga, Khulna'},
    {id:5,name:'Shiromoni',lat:22.8456,lng:89.5123,type:'residential',address:'Shiromoni, Khulna'},
    {id:6,name:'City Center',lat:22.8456,lng:89.5400,type:'commercial',address:'City Center, Khulna'},
    {id:7,name:'Boyra',lat:22.8678,lng:89.5345,type:'commercial',address:'Boyra, Khulna'},
    {id:8,name:'Khalishpur',lat:22.8890,lng:89.5567,type:'industrial',address:'Khalishpur, Khulna'}
];

// Blynk IoT Configuration
const BLYNK_AUTH_TOKEN = "2qVG47iB5eI69ZYUJIPlP8vQCj6ob32B";
const BLYNK_BASE_URL = `https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&`;

async function fetchBlynkFillLevel() {
    try {
        const response = await fetch(BLYNK_BASE_URL + "V1");
        const fillLevel = await response.text();
        return Math.min(100, Math.max(0, parseInt(fillLevel) || 0));
    } catch(e) { return 0; }
}

async function fetchBlynkDistance() {
    try {
        const response = await fetch(BLYNK_BASE_URL + "V0");
        const distance = await response.text();
        return parseFloat(distance) || 0;
    } catch(e) { return 0; }
}

async function fetchBlynkServo() {
    try {
        const response = await fetch(BLYNK_BASE_URL + "V2");
        const servo = await response.text();
        return parseInt(servo) || 0;
    } catch(e) { return 0; }
}

// AI Waste Categories
const wasteCategories = {
    plastic_bottle: {name:'Plastic Bottle',category:'Plastic',recyclable:true,disposal:'Blue Bin',co2Saved:0.5},
    glass_bottle: {name:'Glass Bottle',category:'Glass',recyclable:true,disposal:'Green Bin',co2Saved:0.8},
    paper: {name:'Paper',category:'Paper',recyclable:true,disposal:'Blue Bin',co2Saved:0.3},
    aluminum_can: {name:'Aluminum Can',category:'Metal',recyclable:true,disposal:'Blue Bin',co2Saved:0.6},
    food_waste: {name:'Food Waste',category:'Organic',recyclable:true,disposal:'Green Bin',co2Saved:0.2},
    battery: {name:'Battery',category:'Hazardous',recyclable:false,disposal:'Special Facility',co2Saved:0}
};

// Recycling Guide Items
const recyclingItems = [
    {id:1,item:'Plastic Bottle',category:'Plastic',recyclable:true,instructions:'Rinse and remove cap',disposal:'Blue Bin'},
    {id:2,item:'Glass Bottle',category:'Glass',recyclable:true,instructions:'Clean and remove lid',disposal:'Green Bin'},
    {id:3,item:'Paper',category:'Paper',recyclable:true,instructions:'Keep dry',disposal:'Blue Bin'},
    {id:4,item:'Aluminum Can',category:'Metal',recyclable:true,instructions:'Rinse and crush',disposal:'Blue Bin'},
    {id:5,item:'Food Waste',category:'Organic',recyclable:true,instructions:'Compostable',disposal:'Green Bin'},
    {id:6,item:'Battery',category:'Hazardous',recyclable:false,instructions:'Handle with care',disposal:'Special Facility'}
];

const ADMIN_SECRET_KEY = 'ADMIN123';

// Graph Class for Route Optimization
class Graph {
    constructor(){this.nodes=[];this.adjacencyList={}}
    addNode(node){if(!this.nodes.includes(node)){this.nodes.push(node);this.adjacencyList[node]=[]}}
    addEdge(n1,n2,w){this.adjacencyList[n1].push({node:n2,weight:w});this.adjacencyList[n2].push({node:n1,weight:w})}
    findShortestPath(start,end){
        if(!this.nodes.includes(start)||!this.nodes.includes(end))return null;
        let distances={},previous={},unvisited=new Set(this.nodes);
        this.nodes.forEach(n=>{distances[n]=Infinity;previous[n]=null});distances[start]=0;
        while(unvisited.size>0){
            let current=null,minDist=Infinity;
            for(let node of unvisited)if(distances[node]<minDist){minDist=distances[node];current=node}
            if(current===end||current===null)break;unvisited.delete(current);
            for(let neighbor of this.adjacencyList[current]){
                let distance=distances[current]+neighbor.weight;
                if(distance<distances[neighbor.node]){distances[neighbor.node]=distance;previous[neighbor.node]=current}
            }
        }
        let path=[],cur=end;while(cur){path.unshift(cur);cur=previous[cur]}return{path,distance:distances[end]}
    }
}
const routeGraph=new Graph();
KHULNA_LOCATIONS.forEach(l=>routeGraph.addNode(l.name));
for(let i=0;i<KHULNA_LOCATIONS.length;i++)for(let j=i+1;j<KHULNA_LOCATIONS.length;j++)routeGraph.addEdge(KHULNA_LOCATIONS[i].name,KHULNA_LOCATIONS[j].name,(Math.random()*5+1).toFixed(1));
