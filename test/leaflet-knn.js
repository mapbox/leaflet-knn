if (typeof require !== 'undefined') {
    expect = require('expect.js');
    leafletKnn = require('../');
}

describe('Leaflet KNN', function() {
    describe('structure', function() {
        it('exists', function() {
            expect(leafletKnn).to.be.ok;
        });
        it('nearestPoints', function() {
            expect(leafletKnn.nearestPoints).to.be.a.function;
        });
    });

    describe('#index', function() {
        var gj;
        beforeEach(function() {
            gj = L.geoJson(testCities);
        });
        it('generates an index function', function() {
            expect(leafletKnn(gj)).to.be.a.function;
        });
        it('throws on wrong input', function() {
            expect(function() {
                leafletKnn('foo');
            }).to.throwException(/must be L\.GeoJSON/);
        });
    });

    describe('#nearestPoints', function() {
        var gj;
        beforeEach(function() {
            gj = L.geoJson(testCities);
        });

        it('calculates five nearest points', function() {
            var res = leafletKnn(gj).nearest([-78, 38], 5);
            expect(res).to.be.ok;
            expect(res).to.have.length(5);
        });

        it('supports a distance query', function() {
            var res = leafletKnn(gj).nearest([-78, 38], Infinity, 20 * 1000 * 1000);
            expect(res).to.be.ok;
            expect(res).to.have.length(522);
        });

        it('calculates just one point', function() {
            var res = leafletKnn(gj).nearest([-78, 38], 1);
            expect(res).to.be.ok;
            expect(res).to.have.length(1);
        });

        it('calculates all the points', function() {
            var res = leafletKnn(gj).nearest([-78, 38]);
            expect(res).to.be.ok;
            expect(res).to.have.length(testCities.features.length);
        });
    });
});
