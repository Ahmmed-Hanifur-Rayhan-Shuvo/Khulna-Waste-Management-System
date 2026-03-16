// Khulna City Locations with Coordinates
const KHULNA_LOCATIONS = [
    { id: 1, name: 'Khulna University', lat: 22.9015, lng: 89.5012, type: 'educational' },
    { id: 2, name: 'Khulna Medical College', lat: 22.8125, lng: 89.5645, type: 'medical' },
    { id: 3, name: 'Gollamari', lat: 22.8345, lng: 89.5412, type: 'area' },
    { id: 4, name: 'Sonadanga', lat: 22.8345, lng: 89.5412, type: 'area' },
    { id: 5, name: 'Shiromoni', lat: 22.8456, lng: 89.5123, type: 'area' },
    { id: 6, name: 'Fultala', lat: 22.8567, lng: 89.5234, type: 'area' },
    { id: 7, name: 'Boyra', lat: 22.8678, lng: 89.5345, type: 'area' },
    { id: 8, name: 'Doulatpur', lat: 22.8789, lng: 89.5456, type: 'area' },
    { id: 9, name: 'Khalishpur', lat: 22.8890, lng: 89.5567, type: 'industrial' },
    { id: 10, name: 'RUET', lat: 22.8991, lng: 89.5678, type: 'educational' }
];

// Distance Matrix (in km)
const DISTANCE_MATRIX = {
    'Khulna University': {
        'Gollamari': 3.5,
        'Sonadanga': 4.2,
        'Boyra': 5.8,
        'Fultala': 7.2
    },
    'Khulna Medical College': {
        'Gollamari': 3.5,
        'Sonadanga': 4.2,
        'Khalishpur': 4.1,
        'RUET': 3.7
    },
    'Gollamari': {
        'Khulna University': 3.5,
        'Khulna Medical College': 3.5,
        'Sonadanga': 2.1,
        'Boyra': 3.9
    },
    'Sonadanga': {
        'Khulna University': 4.2,
        'Khulna Medical College': 4.2,
        'Gollamari': 2.1,
        'Boyra': 1.8,
        'Fultala': 4.3
    },
    'Boyra': {
        'Sonadanga': 1.8,
        'Gollamari': 3.9,
        'Fultala': 2.5,
        'Doulatpur': 5.3
    },
    'Fultala': {
        'Boyra': 2.5,
        'Sonadanga': 4.3,
        'Doulatpur': 3.0,
        'Khalishpur': 5.3
    },
    'Doulatpur': {
        'Fultala': 3.0,
        'Boyra': 5.3,
        'Khalishpur': 2.3
    },
    'Khalishpur': {
        'Doulatpur': 2.3,
        'Fultala': 5.3,
        'Khulna Medical College': 4.1
    },
    'RUET': {
        'Khulna Medical College': 3.7,
        'Shiromoni': 2.9
    },
    'Shiromoni': {
        'RUET': 2.9
    }
};

// Graph Class for Route Optimization
class Graph {
    constructor() {
        this.nodes = [];
        this.adjacencyList = {};
    }

    addNode(node) {
        this.nodes.push(node);
        this.adjacencyList[node] = [];
    }

    addEdge(node1, node2, weight) {
        this.adjacencyList[node1].push({ node: node2, weight });
        this.adjacencyList[node2].push({ node: node1, weight });
    }

    findShortestPath(start, end) {
        let distances = {};
        let previous = {};
        let pq = new PriorityQueue();

        // Initial state
        distances[start] = 0;
        pq.enqueue(start, 0);

        this.nodes.forEach(node => {
            if (node !== start) {
                distances[node] = Infinity;
            }
            previous[node] = null;
        });

        while (!pq.isEmpty()) {
            let current = pq.dequeue().element;

            if (current === end) {
                // Build path
                let path = [];
                let temp = end;
                while (temp) {
                    path.unshift(temp);
                    temp = previous[temp];
                }
                return {
                    path,
                    distance: distances[end]
                };
            }

            if (current && this.adjacencyList[current]) {
                this.adjacencyList[current].forEach(neighbor => {
                    let distance = distances[current] + neighbor.weight;
                    if (distance < distances[neighbor.node]) {
                        distances[neighbor.node] = distance;
                        previous[neighbor.node] = current;
                        pq.enqueue(neighbor.node, distance);
                    }
                });
            }
        }

        return null;
    }
}

// Priority Queue for Dijkstra
class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(element, priority) {
        this.values.push({ element, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return this.values.length === 0;
    }
}

// Initialize Graph with Khulna Locations
function initializeRouteGraph() {
    const graph = new Graph();
    
    // Add all nodes
    KHULNA_LOCATIONS.forEach(loc => {
        graph.addNode(loc.name);
    });

    // Add edges with distances
    for (let from in DISTANCE_MATRIX) {
        for (let to in DISTANCE_MATRIX[from]) {
            graph.addEdge(from, to, DISTANCE_MATRIX[from][to]);
        }
    }

    return graph;
}

const routeGraph = initializeRouteGraph();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KHULNA_LOCATIONS, DISTANCE_MATRIX, routeGraph };
}