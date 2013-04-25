var sphereKnn = require('sphere-knn');

module.exports = function(layer) {
    'use strict';
    if (!(layer instanceof L.GeoJSON)) throw new Error('must be L.GeoJSON');
    var points = [];

    layer.eachLayer(function(l) {
        if (l instanceof L.Marker) {
            var ll = l.getLatLng();
            ll.layer = l;
            points.push(ll);
        }
    });

    var sknn = sphereKnn(points);

    sknn.nearest = function(p, n, max_distance) {
        if (p instanceof L.LatLng) p = [p.lng, p.lat];
        return sknn(p[1], p[0], n, max_distance);
    };

    return sknn;
};
