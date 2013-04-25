all: leaflet-knn.min.js

leaflet-knn.js: index.js package.json
	browserify -s leafletKnn index.js > leaflet-knn.js

leaflet-knn.min.js: leaflet-knn.js
	uglifyjs leaflet-knn.js -c > leaflet-knn.min.js
