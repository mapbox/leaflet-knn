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

    describe('#nearest', function() {
        var gj, sq;
        beforeEach(function() {
            gj = L.geoJson(testCities);
            sq = L.geoJson(squares);
        });

        describe('points', function() {
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

        describe('polygons', function() {
            it('finds local points from polygons', function() {
                var res = leafletKnn(sq).nearest([0, 0], 5);
                expect(res).to.be.ok;
                expect(res).to.have.length(5);
            });
            it('calculates the closest country bbox', function() {
                var res = leafletKnn(sq).nearest([0, 0], 1);
                expect(res).to.be.ok;
                expect(res[0].layer.feature.properties.name).to.eql('Mali');
            });
        });
    });

    describe('#nearestLayer', function() {
        var gj, sq;
        beforeEach(function() {
            gj = L.geoJson(testCities);
            sq = L.geoJson(squares);
        });
        describe('polygons', function() {
            it('calculates three nearest layers', function() {
                var res = leafletKnn(sq).nearestLayer([0, 0], 100);
                expect(res).to.be.ok;
                expect(res).to.have.length(3);
            });
        });
    });
});
