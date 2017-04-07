var satellite = L.tileLayer(
    'https://api.mapbox.com/v4/{mapId}/{z}/{x}/{y}.png?access_token={token}', {
        // tileSize: 512,
        mapId: 'mapbox.streets-satellite',
        token: 'pk.eyJ1IjoidGFkaXJhbWFuIiwiYSI6IktzUnNGa28ifQ.PY_hnRMhS94SZmIR2AIgug',
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

var gray = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/{scheme}/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
    attribution: 'Map &copy; 2016 <a href="http://developer.here.com">HERE</a> | ',
    subdomains: '1234',
    base: 'base',
    type: 'maptile',
    scheme: 'reduced.day',
    app_id: 'zA9ZMp4PDxuu1SQgUdli',
    app_code: 'KcLwh4ecuY-aMsT_HY6hIQ',
    mapID: 'newest',
    maxZoom: 22,
    language: 'eng',
    format: 'png8',
    size: '256'
})

var mapObject = new L.Map('map', {
    center: [37.779242, -78.775051],
    zoom: 8,
    animate: true,
    layers: [satellite, gray]
});

var baseMaps = {
    "Satellite": satellite,
    "Grayscale": gray
};

L.control.layers(baseMaps, null, {position: 'topleft', collapsed: false}).addTo(mapObject);


var initialBounds = mapObject.getBounds();
var list = document.getElementById("list");
$("#map-container").append("<div class='right-overlay'><p>Click on the buttons or directly on the map to explore</p></div>");


var stateStyle = {
    "color": "#F15F4D",
    "weight": 4,
    "opacity": 1,
    "fillColor": "#F15F4D",
    "fillOpacity": 1
};

var arecStyleZoomedOut = {
    "color": "#F15F4D",
    "weight": 4,
    "opacity": 1,
    "fillColor": "#F15F4D",
    "fillOpacity": 0.2
};
var arecStyleZoomedIn = {
    "color": "#F15F4D",
    "weight": 2,
    "opacity": 0,
    "fillColor": "#F15F4D",
    "fillOpacity": 0
};
var buildingsStyle = {
    "color": "#37474f",
    "weight": 1,
    "opacity": 1,
    "fillColor": "#37474f",
    "fillOpacity": 1
};


var parcelColor = function (ownership) {
    if (ownership == 'Leased') {
        return '#F1B242';
    } else if (ownership == 'VT') {
        return '#9F1C51';
    } else if (ownership == 'VT Foundation') {
        return '#2572B5';
    } else if (ownership == 'Leased from VT Foundation') {
        return '#ff6825';
    } else if (ownership == 'Owned by VA Beach') {
        return '#3E3D83';
    }
    else {
        return 'gray';
    }
};

var stateBoundaries;
var arecBoundaries;
var buildingBoundaries;
var parcelBoundaries;
var arecMarkers = new L.layerGroup();
var arecMarkersText = new L.layerGroup();
var sql = new cartodb.SQL({user: 'sasaki', format: 'geojson'});
// var sqlState = new cartodb.SQL({user: 'sasaki'});


//State Layer
// sqlState.execute("SELECT * FROM leaf_state")
//     .done(function (data) {
//         stateBoundaries = L.geoJson(data, {
//             style: stateStyle
//         }).addTo(mapObject);
//     })
//     .error(function (errors) {
//         // errors contains a list of errors
//         console.log("errors:" + errors);
//     });


//AREC Boundary Layer
sql.execute("SELECT * FROM leaf_arecs2")
    .done(function (data) {
        arecBoundaries = L.geoJson(data, {
            style: arecStyleZoomedOut,
            onEachFeature: eachArec
        }).addTo(mapObject);
        arecMarkers.addTo(mapObject);
        arecMarkersText.addTo(mapObject);
        $("#buttons").append("<div id='reset-view' class='main-button'>Reset View</div>");
        clickableDiv();
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })


//Parcel Layer (to be color coded)
sql.execute("SELECT * FROM leaf_parc_1")
    .done(function (data) {
        parcelBoundaries = L.geoJson(data, {
            onEachFeature: function (feature, layer) {
                var siteName = feature.properties.site_name;
                var addName = feature.properties.add_names ? feature.properties.add_names : "";
                var size = (Math.round(feature.properties.gis_acres * 100) / 100) + " acres";
                var ownership = feature.properties.ownership_;
                layer.bindPopup("<h2>" + addName + "</h2><p><strong>Size:</strong> " + size + "</p><p><strong>Ownership: </strong>" + ownership + "</p>");
                layer.on("mouseover", function (e) {
                    // console.log(feature.properties);
                    // do something here like display a popup
                    layer.setStyle({
                        weight: 3
                    })
                });
                layer.on("mouseout", function (e) {
                    // do something here like display a popup
                    layer.setStyle({
                        weight: 1
                    })
                });
                layer.cartodb_id = feature.properties.cartodb_id;
                layer.setStyle({
                    color: parcelColor(feature.properties.ownership_),
                    weight: 1,
                });

            }
        }).addTo(mapObject)
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })

//Building Layer
sql.execute("SELECT * FROM leaf_bldgs")
    .done(function (data) {
        buildingBoundaries = L.geoJson(data, {
            style: buildingsStyle,
            onEachFeature: function (feature, layer) {
                var description = feature.properties.descriptio;
                var size = feature.properties.gross + " sq ft";
                var number = feature.properties.property;
                layer.bindPopup("<h4>" + description + "</h4><p><strong>Building Number: </strong>" + number + "</p><p><strong>Size: </strong>" + size + "</p>");
                layer.on("mouseover", function (e) {
                    console.log("bldg")
                    // do something here like display a popup
                    layer.setStyle({
                        weight: 3
                    })
                });
                layer.on("mouseout", function (e) {
                    // do something here like display a popup
                    layer.setStyle({
                        weight: 1
                    })
                });
            }
        }).addTo(mapObject);
        $(".leaflet-marker-icon").on("mouseover", function () {
        })
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })

function createButtons(id, name) {
    $("#buttons").append("<div id='" + id + "' class='main-button'>" + name + "</div>");
}

function eachArec(feature, layer) {
    createButtons(layer.feature.properties.cartodb_id, layer.feature.properties.site_name);
    if (layer.feature.properties.town == "Winchester") {
        var lastUpdated = layer.feature.properties.last_updated;
        $(".leaflet-control-attribution").append("<div class='last-updated'>  Last Updated: " + lastUpdated +"</div>")
    }

    if (feature.geometry.type == 'MultiPolygon') {

        // Don't stroke and do opaque fill
        layer.setStyle({
            'weight': 0,
            'fillOpacity': 0
        });

        // Get bounds of polygon
        var bounds = layer.getBounds();

        // Get center of bounds
        var center = bounds.getCenter();
        var strippedText = layer.feature.properties.site_name.replace('AREC', '');
        $("#text-size-div").remove();
        $("<div id='text-size-div'></div>").appendTo("#top-section");
        $("#text-size-div").html(strippedText);
        var test = $("#text-size-div");
        var height = (test.height + 1) + "px";
        var width = $(test).width();
        var markerText = L.divIcon({
            iconSize: new L.Point(width + 50, 30),
            class: 'arec-marker',
            iconAnchor: [5, 10],
            html: '<svg width="15" height="10"><circle cx="5" cy="5" r="5" stroke-width="0" fill="#F15F4D" /> </svg><span class="marker-text">' + strippedText + '</span>'
        });

        var markerContainer = L.marker(center, {icon: markerText});

        arecMarkersText.addLayer(markerContainer);


        markerContainer.on("click", function (event) {
            console.log(layer.feature.properties.facility_u);
            $(".right-overlay").addClass("with-content");

            // event.preventDefault(); // Prevent the link from scrolling the page.
            var bounds = layer.getBounds();
            var center = bounds.getCenter();
            if ((bounds._northEast.lat - bounds._southWest.lat) > 0.009) {
                mapObject.fitBounds(layer.getBounds(), {padding: [10, 10]});
            }
            else {
                mapObject.fitBounds(layer.getBounds(), {padding: [175, 175]});
            }

            var upgrades;

            if (layer.feature.properties.facility_u == "No data") {
                upgrades = "No data available"
            }
            else {
                upgrades = layer.feature.properties.facility_u + " (2009-2011)";
            }
            var size = layer.feature.properties.size + " acres";
            var name = layer.feature.properties.arec_name;
            var image = "img/photos/" + layer.feature.properties.photos;
            var location = layer.feature.properties.town + ", " + layer.feature.properties.county;
            var focus = layer.feature.properties.study_focu;
            var director = layer.feature.properties.director;
            var faculty = layer.feature.properties.resident_f;
            var otherFaculty = layer.feature.properties.other_facu;
            var students = layer.feature.properties.students_a;
            var employees = layer.feature.properties.employees_;
            var otherEmployees = layer.feature.properties.employees2;
            var buildings = layer.feature.properties.buildings_;
            var totalGSF = layer.feature.properties.total_gsf;
            var inset = "img/resized/" + layer.feature.properties.locator_ma;
            var arecLink = "http://arec.vaes.vt.edu/arec" + layer.feature.properties.link;
            $(".right-overlay").html("<img class='arec-photo' src='" + image + "'><h2>" + name + "</h2><p style='font-style: italic; margin-bottom: 15px;'>" + location + "</p><p><strong>Size:</strong> " + size + "</p><p><strong>Study Focus: </strong> " + focus + "</p><h3>People</h3><p><strong>Director: </strong> " + director + "</p><p><strong>Resident Faculty: </strong> " + faculty + "</p><p><strong>Other Faculty: </strong> " + otherFaculty + "</p><p><strong>Students: </strong> " + students + "</p><p><strong>Full-time Employees: </strong> " + employees + "</p><p><strong>Other Employees: </strong> " + otherEmployees + "</p><h3>Facilities</h3><p><strong>Buildings: </strong> " + buildings + "</p><p><strong>Total GSF: </strong> " + totalGSF + "</p><p><strong>Facility Upgrades: </strong> " + upgrades + "</p><div><a class='arec-link' target='_new' href=" + arecLink + ">Visit AREC Website</a></div>");
            $(".inset-image").html("<img class='arec-location' src=" + inset + ">");

        });
    }
}
function allProps(props) {
    var result = [];
    for (var prop in props) {
        result.push(props[prop]);
    }
    return result.join(", ");
}
function clickableDiv() {
    $(".main-button").click(function (d) {
        $(".right-overlay").addClass("with-content");

        if (this.id == "reset-view") {
            mapObject.fitBounds(initialBounds);
            $(".right-overlay").html("<p>Click on the buttons or directly on the map to explore</p></div>").removeClass("with-content");
        }
        else {
            var buttonId = this.id;
            // console.log(buttonId);
            arecBoundaries.eachLayer(function (layer) {
                if (layer.feature.properties.cartodb_id == buttonId) {
                    // console.log(layer.feature);
                    var bounds = layer.getBounds();
                    var center = bounds.getCenter();
                    if ((bounds._northEast.lat - bounds._southWest.lat) > 0.009) {
                        mapObject.fitBounds(layer.getBounds(), {padding: [10, 10]});
                    }
                    else {
                        mapObject.fitBounds(layer.getBounds(), {padding: [175, 175]});
                    }
                    var size = layer.feature.properties.size + " acres";
                    var name = layer.feature.properties.arec_name;
                    var image = "img/photos/" + layer.feature.properties.photos;
                    var location = layer.feature.properties.town + ", " + layer.feature.properties.county;
                    var focus = layer.feature.properties.study_focu;
                    var director = layer.feature.properties.director;
                    var faculty = layer.feature.properties.resident_f;
                    var otherFaculty = layer.feature.properties.other_facu;
                    var students = layer.feature.properties.students_a;
                    var employees = layer.feature.properties.employees_;
                    var otherEmployees = layer.feature.properties.employees2;
                    var buildings = layer.feature.properties.buildings_;
                    var totalGSF = layer.feature.properties.total_gsf;
                    var upgrades;

                    if (layer.feature.properties.facility_u == "No data") {
                        upgrades = "No data available"
                    }
                    else {
                        upgrades = layer.feature.properties.facility_u + " (2009-2011)";
                    }
                    var inset = "img/resized/" + layer.feature.properties.locator_ma;
                    var arecLink = "http://arec.vaes.vt.edu/arec" + layer.feature.properties.link;
                    // console.log(content);
                    $(".inset-image").html("<img class='arec-location' src=" + inset + ">");
                    $(".right-overlay").html("<img class='arec-photo' src='" + image + "'><h2>" + name + "</h2><p style='font-style: italic; margin-bottom: 15px;'>" + location + "</p><p><strong>Size:</strong> " + size + "</p><p><strong>Study Focus: </strong> " + focus + "</p><h3>People</h3><p><strong>Director: </strong> " + director + "</p><p><strong>Resident Faculty: </strong> " + faculty + "</p><p><strong>Other Faculty: </strong> " + otherFaculty + "</p><p><strong>Students: </strong> " + students + "</p><p><strong>Full-time Employees: </strong> " + employees + "</p><p><strong>Other Employees: </strong> " + otherEmployees + "</p><h3>Facilities</h3><p><strong>Buildings: </strong> " + buildings + "</p><p><strong>Total GSF: </strong> " + totalGSF + "</p><p><strong>Facility Upgrades: </strong> " + upgrades + "</p><div><a class='arec-link' target='_new' href=" + arecLink + ">Visit AREC Website</a></div>");


                }
            })
        }

    })
}

var legend = L.control({position: 'bottomleft'});
legend.onAdd = function (mapObject) {
    var div = L.DomUtil.create('div', 'info legend-container'),
        grades = ['VT', 'VT Foundation', 'Leased from VT Foundation', 'Leased', 'Owned by VA Beach'];
    // loop through our density intervals and generate a label with a colored square for each interval
    div.innerHTML += '<div class="inset-image"></div>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<div class="legend-swatch" style="background:' + parcelColor(grades[i]) + '"></div> ' +
            grades[i] + '<br>';
    }
    return div;
};

legend.addTo(mapObject);


$(".legend-container").hide();

mapObject.on('zoomend', function () {
    if (mapObject.getZoom() < 12) {
        mapObject.removeLayer(buildingBoundaries);
        mapObject.removeLayer(parcelBoundaries);
        mapObject.addLayer(arecMarkers);
        mapObject.addLayer(arecMarkersText);
        // mapObject.addLayer(arecBoundaries);
        $(".legend-container").hide();
    }
    if (mapObject.getZoom() >= 12) {
        // mapObject.removeLayer(countiesBoundaries);
        mapObject.removeLayer(arecMarkers);
        mapObject.removeLayer(arecMarkersText);
        mapObject.removeLayer(arecBoundaries);
        mapObject.addLayer(parcelBoundaries);
        mapObject.addLayer(buildingBoundaries);
        buildingBoundaries.bringToFront();
        $(".legend-container").show();

    }

});


