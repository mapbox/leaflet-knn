## leaflet-knn

Next-nearest neighbor searches with [sphere-knn](https://github.com/darkskyapp/sphere-knn),
with a [Leaflet](http://leafletjs.com/)-friendly API.

## example

```js
var gj = L.geoJson(GEOJSON_DATA);
var nearest = leafletKnn(gj).nearest(L.latLng(38, -78), 5);
```

## api

### `leafletKnn(layer)`

Generates a lookup function from an `L.geoJson` layer object.

API is the same as the [sphere-knn](https://github.com/darkskyapp/sphere-knn) API
for the lookup function, but with nice handling for `l.latlng`

### `index.nearest(point: L.LatLng or [lon, lat], n, max_distance)`

* point: L.LatLng or [lon, lat], index, [max points: int], [max distance: number])`
* n: how many
* max_distance: maximum distance in meters
