var sphereKnn = require('sphere-knn');

module.exports = function(layer) {
    'use strict';

    if (!(layer instanceof L.GeoJSON)) throw new Error('must be L.GeoJSON');

    var points = [];

    layer.eachLayer(collectPoints);

    function collectPoints(l) {
        points = points.concat(reformat(flat(l.feature.geometry.coordinates), l));
    }

    var sknn = sphereKnn(points);

    sknn.nearest = function(p, n, max_distance) {
        if (p instanceof L.LatLng) p = [p.lng, p.lat];
        return sknn(p[1], p[0], n, max_distance);
    };

    sknn.nearestLayer = function(p, n, max_distance) {
        if (p instanceof L.LatLng) p = [p.lng, p.lat];
        return collapse(sknn(p[1], p[0], n, max_distance));
    };

    return sknn;
};

function collapse(results) {
    var l = [], included = {};
    for (var i = 0; i < results.length; i++) {
        if (included[L.stamp(results[i].layer)] == undefined) {
            l.push(results[i]);
            included[L.stamp(results[i].layer)] = true;
        }
    }
    return l;
}

function reformat(coords, layer) {
    var l = [];
    for (var i = 0; i < coords.length; i++) {
        l.push({ lon: coords[i][0], lat: coords[i][1], layer: layer });
    }
    return l;
}

function flat(coords) {
    var i = 0, j = 0, k = 0, l = [];
    if (typeof coords[0] === 'object' &&
        typeof coords[0][0] === 'object' &&
        typeof coords[0][0][0] === 'object') {
        for (;i < coords.length; i++) {
            for (;j < coords[i].length; j++) {
                for (;k < coords[i][j].length; k++) l.push(coords[i][j][k]);
            }
        }
        return l;
    } else if (typeof coords[0] === 'object' &&
        typeof coords[0][0] === 'object') {
        for (;i < coords.length; i++) {
            for (;j < coords[i].length; j++) l.push(coords[i][j]);
        }
        return l;
    } else if (typeof coords[0] === 'object') {
        return coords;
    } else {
        return [coords];
    }
}
