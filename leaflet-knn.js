(function(e){if("function"==typeof bootstrap)bootstrap("leafletknn",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeLeafletKnn=e}else"undefined"!=typeof window?window.leafletKnn=e():global.leafletKnn=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"sphere-knn":2}],2:[function(require,module,exports){
var spherekd = require("./lib/spherekd")

module.exports = function(points) {
  /* Inflate the toad! */
  var root = spherekd.build(points)

  /* Lurch off into the sunset! */
  return function(lat, lon, n, max) {
    return spherekd.lookup(lat, lon, root, n, max)
  }
}

},{"./lib/spherekd":5}],3:[function(require,module,exports){
function defaultComparator(a, b) {
  return a - b
}

exports.search = function(item, array, comparator) {
  if(!comparator)
    comparator = defaultComparator

  var low  = 0,
      high = array.length - 1,
      mid, comp

  while(low <= high) {
    mid  = (low + high) >>> 1
    comp = comparator(array[mid], item)

    if(comp < 0)
      low = mid + 1

    else if(comp > 0)
      high = mid - 1

    else
      return mid
  }

  return -(low + 1)
}

exports.insert = function(item, array, comparator) {
  var i = exports.search(item, array, comparator)

  if(i < 0)
    i = -(i + 1)

  array.splice(i, 0, item)
}

},{}],4:[function(require,module,exports){
var binary = require("./binary")

function Node(axis, split, left, right) {
  this.axis  = axis
  this.split = split
  this.left  = left
  this.right = right
}

function distance(a, b) {
  var i = Math.min(a.length, b.length),
      d = 0,
      k

  while(i--) {
    k  = b[i] - a[i]
    d += k * k
  }

  return d
}

function byDistance(a, b) {
  return a.dist - b.dist
}

function buildrec(array, depth) {
  /* This should only happen if you request a kd-tree with zero elements. */
  if(array.length === 0)
    return null

  /* If there's only one item, then it's a leaf node! */
  if(array.length === 1)
    return array[0]

  /* Uh oh. Well, we have to partition the data set and recurse. Start by
   * finding the bounding box of the given points; whichever side is the
   * longest is the one we'll use for the splitting plane. */
  var axis = depth % array[0].position.length

  /* Sort the points along the splitting plane. */
  /* FIXME: For very large trees, it would be faster to use some sort of median
   * finding and partitioning algorithm. It'd also be a lot more complicated. */
  array.sort(function(a, b) {
    return a.position[axis] - b.position[axis]
  })

  /* Find the median point. It's position is going to be the location of the
   * splitting plane. */
  var i = Math.floor(array.length * 0.5)

  /* Split, recurse, yadda yadda. */
  ++depth

  return new Node(
    axis,
    array[i].position[axis],
    buildrec(array.slice(0, i), depth),
    buildrec(array.slice(i   ), depth)
  )
}

function build(array) {
  return buildrec(array, 0)
}

function lookup(position, node, n, max) {
  if(!(max > 0))
    max = Number.POSITIVE_INFINITY

  var array = []

  /* Degenerate cases. */
  if(node === null || n <= 0)
    return array

  var stack = [node, 0],
      dist, i

  while(stack.length) {
    dist = stack.pop()
    node = stack.pop()

    /* If this subtree is further away than we care about, then skip it. */
    if(dist > max)
      continue

    /* If we've already found enough locations, and the furthest one is closer
     * than this subtree possibly could be, just skip the subtree. */
    if(array.length === n && array[array.length - 1].dist < dist * dist)
      continue

    /* Iterate all the way down the tree, adding nodes that we need to remember
     * to visit later onto the stack. */
    while(node instanceof Node) {
      if(position[node.axis] < node.split) {
        stack.push(node.right, node.split - position[node.axis])
        node = node.left
      }

      else {
        stack.push(node.left, position[node.axis] - node.split)
        node = node.right
      }
    }

    /* Once we've hit a leaf node, insert it into the array of candidates,
     * making sure to keep the array in sorted order. */
    dist = distance(position, node.position)
    if(dist <= max * max)
      binary.insert({object: node, dist: dist}, array, byDistance)

    /* If the array's too long, cull it. */
    if(array.length > n)
      array.pop()
  }

  /* Strip candidate wrapper objects. */
  i = array.length

  while(i--)
    array[i] = array[i].object

  return array
}

exports.build  = build
exports.lookup = lookup

},{"./binary":3}],5:[function(require,module,exports){
var kd               = require("./kd"),
    rad              = Math.PI / 180,
    invEarthDiameter = 1 / 12742018 /* meters */

function spherical2cartesian(lat, lon) {
  lat *= rad
  lon *= rad
  var cos = Math.cos(lat)
  return [cos * Math.cos(lon), Math.sin(lat), cos * Math.sin(lon)]
}

function Position(object) {
  var lat, lon;

  /* Find latitude. */
  if(object.hasOwnProperty("lat"))
    lat = object.lat;

  else if(object.hasOwnProperty("latitude"))
    lat = object.latitude;

  else if(object.hasOwnProperty("location") &&
          Array.isArray(object.location) &&
          object.location.length === 2)
    lat = object.location[0];

  /* Find longitude. */
  if(object.hasOwnProperty("lon"))
    lon = object.lon;

  else if(object.hasOwnProperty("longitude"))
    lon = object.longitude;

  else if(object.hasOwnProperty("lng"))
    lon = object.lng;

  else if(object.hasOwnProperty("long"))
    lon = object.long;

  else if(object.hasOwnProperty("location") &&
          Array.isArray(object.location) &&
          object.location.length === 2)
    lon = object.location[1];

  /* Finally, set this object's properties. */
  this.object = object;
  this.position = spherical2cartesian(lat, lon);
}

function build(array) {
  var i   = array.length,
      out = new Array(i)

  while(i--)
    out[i] = new Position(array[i])

  return kd.build(out)
}

function lookup(lat, lon, node, n, max) {
  var array = kd.lookup(
        spherical2cartesian(lat, lon),
        node,
        n,
        max > 0 ? 2 * Math.sin(max * invEarthDiameter) : undefined
      ),
      i     = array.length

  /* Strip off position wrapper objects. */
  while(i--)
    array[i] = array[i].object

  return array
}

exports.build  = build
exports.lookup = lookup

},{"./kd":4}]},{},[1])
(1)
});
;