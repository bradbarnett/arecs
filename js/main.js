
var satellite =  L.tileLayer(
    'https://api.mapbox.com/v4/{mapId}/{z}/{x}/{y}.png?access_token={token}', {
        // tileSize: 512,
        mapId: 'mapbox.streets-satellite',
        token: 'pk.eyJ1IjoidGFkaXJhbWFuIiwiYSI6IktzUnNGa28ifQ.PY_hnRMhS94SZmIR2AIgug',
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });


// var satellite =  L.tileLayer('http://mt{s}.googleapis.com/vt?lyrs=y@227134863&src=apiv3&hl=en-US&x={x}&y={y}&z={z}');


var gray = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/{scheme}/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
    attribution: 'Map &copy; 2016 <a href="http://developer.here.com">HERE</a>',
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
    layers: [gray, satellite]
});


// L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    //     attribution: 'CartoDB'
    // }).addTo(mapObject);


    var baseMaps = {
        "Satellite": satellite,
        "Grayscale": gray
    };

    L.control.layers(baseMaps,null,{position: 'topleft'}).addTo(mapObject);



var initialBounds = mapObject.getBounds();


var list = document.getElementById("list");
var sql = new cartodb.SQL({user: 'sasaki', format: 'geojson'});

$("#map-container").append("<div class='right-overlay'><p>Click on the buttons or directly on the map to explore</p></div>");


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

var countiesStyle = {
    "color": "gray",
    "weight": 0.75,
    "opacity": 0.25,
    "fillOpacity": 0
};

var hideLayer = {
    "opacity": 0,
    "fillOpacity": 0
};




var parcelColor = function (ownership) {
    if (ownership == 'Leased') {
        return '#3E3D83';
    } else if (ownership == 'VT') {
        return '#9F1C51';
    } else if (ownership == 'VT Foundation') {
        return '#F1B242';
    } else if (ownership == 'Leased from VT Foundation') {
        return '#ff6825';
    } else if (ownership == 'Owned by VA Beach') {
        return '#2572B5';
    }
    else {
        return 'gray';
    }
};

function checkZoom(mapObject) {
    // console.log(mapObject.getZoom());
    if (mapObject.getZoom() < 12) {
        return 0;
    }
    else {
        return 0.2;
    }
}

var arecBoundaries;
var buildingBoundaries;
var countiesBoundaries;
var parcelBoundaries;


sql.execute("SELECT the_geom FROM leaf_cos")
    .done(function (data) {
        console.log(data);
        countiesBoundaries = L.geoJson(data, {
            style: countiesStyle,
        }).addTo(mapObject);
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })

// create the layer and add to the map, then will be filled with data
sql.execute("SELECT * FROM leaf_arecs2")
    .done(function (data) {
        arecBoundaries = L.geoJson(data, {
            style: arecStyleZoomedOut,
            onEachFeature: eachArec,
        }).addTo(mapObject);
        $("#buttons").append("<div id='reset-view' class='main-button'>Reset View</div>");

        clickableDiv();
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })

sql.execute("SELECT the_geom,ownership_ FROM leaf_parc_1")
    .done(function (data) {
        console.log(data);
        parcelBoundaries = L.geoJson(data, {
            onEachFeature: function (feature, layer) {
                layer.bindPopup('<p><em>' + feature.properties.ownership_ + '</em></p>');
                layer.cartodb_id = feature.properties.cartodb_id;
                layer.setStyle({
                    color: parcelColor(feature.properties.ownership_),
                    weight: 1,
                });
            },
            style: hideLayer
        }).addTo(mapObject);
    })
    .error(function (errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })


sql.execute("SELECT * FROM leaf_bldgs")
    .done(function (data) {
        buildingBoundaries = L.geoJson(data, {
            style: hideLayer,
        }).addTo(mapObject);
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
    var li = document.createElement("li"),
        a = document.createElement("a"),
        content = allProps(feature.properties);

    // Create the "button"
    a.innerHTML = content;
    a.href = "#";
    a.layer = layer; // Store a reference to the actual layer.

    layer.on("click", function (event) {
        // event.preventDefault(); // Prevent the link from scrolling the page.
        mapObject.fitBounds(this.getBounds(), {padding: [175, 175]});
        // layer.openPopup();
        var size = layer.feature.properties.size;
        var name = layer.feature.properties.arec_name;
        var image = "../img/photos/" + layer.feature.properties.photos;
        // console.log(content);
        // layer.bindPopup(content);
        $(".right-overlay").html("<h1>" + name + "</h1><img class='arec-photo' src='" + image + "'><p>Size: " + size + "</p>");

    });
    // li.appendChild(a);
    // list.appendChild(li);
    // layer.bindPopup(content);
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
            /**
             "Eastern Virginia AREC"
             buildings_
             cartodb_id
             county
             director
             employees2
             employees_
             facility_u
             include_ho
             locator_ma
             other_facu
             photos
             resident_f
             site_name
             size
             size_other
             students_a
             study_focu
             total_gsf
             town
             **/
            var buttonId = this.id;
            console.log(buttonId);
            arecBoundaries.eachLayer(function (layer) {
                if (layer.feature.properties.cartodb_id == buttonId) {
                    console.log(layer.feature);
                    mapObject.fitBounds(layer.getBounds(), {padding: [175, 175]});
                    var size = layer.feature.properties.size;
                    var name = layer.feature.properties.arec_name;
                    var image = "../img/photos/" + layer.feature.properties.photos;
                    var inset = "../img/inset/" + layer.feature.properties.locator_ma;
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
                    var upgrades = layer.feature.properties.facility_u;
                    // console.log(content);
                    // layer.bindPopup(content);

                    $(".right-overlay").html("<img class='arec-photo' src='" + image + "'><h1>" + name + "</h1><h4>" + location + "</h4><p><strong>Size:</strong> " + size + "</p><p><strong>Study Focus: </strong> " + focus + "</p><h3>People</h3><p><strong>Director: </strong> " + director + "</p><p><strong>Resident Faculty: </strong> " + faculty + "</p><p><strong>Other Faculty: </strong> " + otherFaculty + "</p><p><strong>Students: </strong> " + students + "</p><p><strong>Full-time Employees: </strong> " + employees + "</p><p><strong>Other Employees: </strong> " + otherEmployees + "</p><h3>Facilities</h3><p><strong>Buildings: </strong> " + buildings + "</p><p><strong>Total GSF: </strong> " + totalGSF + "</p><p><strong>Facility Upgrades: </strong> " + upgrades + "</p>");
                }
            })
        }

    })
}

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (mapObject) {

    var div = L.DomUtil.create('div', 'info legend-container'),
        grades = ['VT','Leased from VT Foundation','VT Foundation','Owned by VA Beach'],
        labels = ['VT','Leased from VT Foundation','VT Foundation','Owned by VA Beach'];

    // loop through our density intervals and generate a label with a colored square for each interval
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
    if (mapObject.getZoom() < 12 && mapObject.hasLayer(buildingBoundaries)) {
        buildingBoundaries.setStyle(hideLayer);
        arecBoundaries.setStyle(arecStyleZoomedOut);
        parcelBoundaries.setStyle(hideLayer);
        $(".legend-container").hide();
    }
    if (mapObject.getZoom() > 12 && mapObject.hasLayer(buildingBoundaries)) {
        buildingBoundaries.setStyle(buildingsStyle);
        arecBoundaries.setStyle(arecStyleZoomedIn);
        parcelBoundaries.setStyle({
            "opacity":0.8,
            "fillOpacity": 0.2
        });
        $(".legend-container").show();

    }
});


// var myLayer = L.geoJson(geojsonMD, {
//     style: function (feature) {
//         return feature.properties.style;
//     },
//     onEachFeature: function (feature, layer) {
//         layer.bindPopup(feature.properties.name);
//     }
// })
//
// myLayer.addData(polygon);
// myLayer.addTo(map);