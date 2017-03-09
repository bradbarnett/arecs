var mapObject = new L.Map('map', {
    center: [37.779242, -78.775051],
    zoom: 8,
    animate: true
});

var initialBounds = mapObject.getBounds();

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: 'CartoDB'
}).addTo(mapObject);

var list = document.getElementById("list");
var sql = new cartodb.SQL({user: 'sasaki', format: 'geojson'});

$(".leaflet-top.leaflet-right").append("<div class='right-overlay'><p>Click on the buttons or directly on the map to explore</p></div>");


var arecStyleZoomedOut = {
    "color": "#ff7043",
    "weight": 4,
    "opacity": 1,
    "fillColor": "gray",
    "fillOpacity":0.1
};

var arecStyleZoomedIn = {
    "color": "#ff7043",
    "weight": 2,
    "opacity": 1,
    "fillColor": "gray",
    "fillOpacity":0.1
};

var buildingsStyle = {
    "color": "#37474f",
    "weight": 1,
    "opacity": 1,
    "fillColor": "#37474f",
    "fillOpacity":1
};

var countiesStyle = {
    "color": "gray",
    "weight": 0.75,
    "opacity": 0.25,
    "fillOpacity":0
};

var hideLayer = {
    "opacity": 0,
    "fillOpacity":0
};

var arecBoundaries;
var buildingBoundaries;
var countiesBoundaries;

// create the layer and add to the map, then will be filled with data
sql.execute("SELECT * FROM arecs_for_leaflet")
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


function createButtons(id,name) {
    $("#buttons").append("<div id='"+ id + "' class='main-button'>"+name+"</div>");
}

function eachArec(feature, layer) {
    createButtons(layer.feature.properties.cartodb_id,layer.feature.properties.site_name);
    var li = document.createElement("li"),
        a = document.createElement("a"),
        content = allProps(feature.properties);

    // Create the "button"
    a.innerHTML = content;
    a.href = "#";
    a.layer = layer; // Store a reference to the actual layer.

    layer.on("click", function (event) {
        // event.preventDefault(); // Prevent the link from scrolling the page.
        mapObject.fitBounds(this.getBounds(),{padding:[175,175]});
        // layer.openPopup();
        var size = layer.feature.properties.total_acre;
        var name = layer.feature.properties.site_name;
        console.log(content);
        // layer.bindPopup(content);
        $(".right-overlay").html("<h1>" + name + "</h1><p>Size: " + size + "</p>");

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

        if (this.id == "reset-view") {
        mapObject.fitBounds(initialBounds);
        $(".right-overlay").html("<p>Click on the buttons or directly on the map to explore</p></div>");

        }
        else {
            var buttonId = this.id;
            console.log(buttonId);
            arecBoundaries.eachLayer(function (layer) {
                if (layer.feature.properties.cartodb_id == buttonId) {
                    console.log(layer);
                    mapObject.fitBounds(layer.getBounds(),{padding:[175,175]});
                    content = layer.feature.properties;
                    var size = layer.feature.properties.total_acre;
                    var name = layer.feature.properties.site_name;
                    console.log(content);
                    // layer.bindPopup(content);
                    $(".right-overlay").html("<h1>" + name + "</h1><p>Size: " + size + "</p>");
                }
            })
        }

    })
}


mapObject.on('zoomend', function () {
    if (mapObject.getZoom() < 12 && mapObject.hasLayer(buildingBoundaries)) {
        buildingBoundaries.setStyle(hideLayer);
        arecBoundaries.setStyle(arecStyleZoomedOut);
    }
    if (mapObject.getZoom() > 12 && mapObject.hasLayer(buildingBoundaries))
    {
        buildingBoundaries.setStyle(buildingsStyle);
        arecBoundaries.setStyle(arecStyleZoomedIn);
    }
});