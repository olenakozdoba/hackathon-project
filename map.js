  // Note: This example requires that you consent to location sharing when
  // prompted by your browser. If you see the error "The Geolocation service
  // failed.", it means you probably did not give permission for the browser to
  // locate you.function initMap() {

var map;
var default_zoomValue = 15;

function initMap() {
  google.maps.InfoWindow.prototype.isOpened = false;
  
  // The looks/feels of the Map is defined initially here, mainly with Control options
  map = new google.maps.Map(document.getElementById('chargemap'), {
    center: {lat: 34.146, lng: -118.130}, //34.1463769,-118.1298394
    zoom: default_zoomValue,
    mapTypeControlOptions: {
      // mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],  // not necessary
      position: google.maps.ControlPosition.LEFT_TOP
    },
  });

  // Search input box defined, an overlay above the Map.
  // The GUI and position (ControlPosition) on the map are defined below.
  var input = document.getElementById('search-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  var markers = [];
  
  //
  // Event occurs when the user changes text on Search box.
  // This function finds all the related locations, their names,
  //   and placed the appropriate markers.
  //
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
       if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
       }
       // Using icon properties for the sake of icon customization
       var icon = {
         size: new google.maps.Size(71, 71),
         origin: new google.maps.Point(0, 0),
         anchor: new google.maps.Point(17, 34),
         scaledSize: new google.maps.Size(35, 35)
       };
       // Set a special icon just for a specific address since the default icon is similar to a Charging station.
       // The icon images are found at:
       //   https://sites.google.com/site/gmapsdevelopment
       //   http://stackoverflow.com/questions/8248077/google-maps-v3-standard-icon-shadow-names-equiv-of-g-default-icon-in-v2
       //
       // However there is no obvious way to determine if the place object is a specific location/address, hence the code below.
       // A possible check is to use place.types, link @ https://developers.google.com/places/supported_types .
       if (places.length == 1) {
         icon.url = "../images/blue-pushpin.png";    // custom icon
       }
       else {
         icon.url = place.icon;     // use the nice Google context icons
       }

       // Create a marker for each place.
       var aMarker = new google.maps.Marker({
         map: map,
         icon: icon,
         // label: place.name,      // don't display the name because Google map will show it anyway when zooming in
         title: place.name,         // tooltip
         position: place.geometry.location
       });
       markers.push(aMarker);

       bounds.extend(place.geometry.location);
       // map.setCenter(bounds.getCenter());     // not necessary
       
    });     // places.forEach

    map.fitBounds(bounds);
    map.setZoom(default_zoomValue);
  });     // addListener

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
	  
	  var image = 'https://i.stack.imgur.com/orZ4x.png';
	  var marker = new google.maps.Marker({
		  position: pos,
		  map: map,
		  icon: image
	  });  
	  marker.setMap(map);
     map.setCenter(pos);
	  
	  var spotRef = firebase.database().ref().child("Spot");
	  
	  spotRef.on("value", function(snapshot) {
	  
		  var spots = [];
		  snapshot.forEach(function(data) {
			spots.push({"key" : data.key, "address" : data.val()["address"], "price" : data.val()["price"]});
		  });
		
		  for (var x = 0; x < spots.length; x++) {
			createMarker(spots[x], map);
		  }

		}, function (errorObject) {
		  console.log("The read failed: " + errorObject.code);
		});
		
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function createMarker(spot, map) {
  $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address='+spot.address+'&sensor=false&key=AIzaSyBtl3l6IRtEBBsi9PjCY3OWcd3t3UU9VLE', null, function (data) {
    var p = data.results[0].geometry.location
    var latlng = new google.maps.LatLng(p.lat, p.lng);
	
   // See https://firebase.google.com/docs/web/setup#project_setup for details on setting up the database.
   var spotRef = firebase.database().ref().child("Spot");
	var addressRef = spotRef.child(spot.key);
   
	var status = 0;
	
	addressRef.on("value", function(snapshot) {
	  status = snapshot.val()["status"];
	}, function (errorObject) {
	  console.log("The read failed: " + errorObject.code);
	});
	
	if(status == 0) {
		var marker = new google.maps.Marker({
		  position: latlng,
		  map: map
		});
		
		var infowindow = new google.maps.InfoWindow({
		  content: '<p>' + '<h3 style="margin-bottom: 10px;">' + spot.key + '</h3>' 
      + spot.address + '<br>$' + spot.price + ' per hour</p><paper-button class="custom" raised onclick="reserveButtonClicked(\''+spot.key+'\', true)">Reserve</paper-button>'
		});
	}
	else {
		var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
		var marker = new google.maps.Marker({
		  position: latlng,
		  map: map,
		  icon: image
		});
		
		var infowindow = new google.maps.InfoWindow({
		  content: '<p>' + '<h3 style="margin-bottom: 10px;">' + spot.key + '</h3>' 
      + spot.address + '<br>$' + spot.price + ' per hour</p> <paper-button class="custom" style="background-color:purple;" raised onclick="reserveButtonClicked(\''+spot.key+'\', false)">Release</paper-button>'
		});
	}
	
	google.maps.event.addListener(marker, 'click', function() {
            if(!marker.open){
                infowindow.open(map,marker);
                marker.open = true;
            }
            else{
                infowindow.close();
                marker.open = false;
            }
            google.maps.event.addListener(map, 'click', function() {
                infowindow.close();
                marker.open = false;
            });
        });
  });
}

function reserveButtonClicked(spotKey, isReserving) {
   var spotRef = firebase.database().ref().child("Spot");
	var addressRef = spotRef.child(spotKey);
	
	if(!isReserving){
		addressRef.on("value", function(snapshot) {
		  var startTime = snapshot.val()["startTime"];
		  if(startTime != 0)
		  {
			  var duration =  Math.round(new Date().getTime()/1000) - startTime;

        var hours = parseInt( duration / 3600 ) % 24;
        var minutes = parseInt( duration / 60 ) % 60;
        var seconds = duration % 60;

        var durationDisplay = (hours > 0 ? (hours + (hours < 2 ? " hour " : " hours ")) : "") + 
          (minutes > 0 ? minutes + (minutes < 2 ? " minute " : " minutes ") : "") + 
          (seconds > 0 ? seconds + (seconds  < 2 ? " second " : " seconds") : "");

        var amountDisplay = "";
        var price = snapshot.val()["price"];
        if (price) {
          amount = (parseFloat(price)* duration/3600).toFixed(2);
          amountDisplay = "\n$" + amount + " will be charged from your credit card. "
        }
        var amount =
			  alert("You have used the spot for " + durationDisplay + ". " + amountDisplay + "\nThank you for using our service. \n\nSee you next time!");
		  }
		}, function (errorObject) {
		  console.log("The read failed: " + errorObject.code);
		});
	}

	addressRef.update({
      "status": isReserving ? 1 : 0,
      "startTime": isReserving ? Math.round(new Date().getTime()/1000) : 0},
      function(snapshot) {
         console.log("The update status: " + snapshot.val());
      }
	);

	location.reload(true);
}

//
// TK - This function is not used anymore. However it is a good sample code to find a location and set a marker.
//
function codeAddress(address) {
  var geocoder = new google.maps.Geocoder(); 
  geocoder.geocode( { 'address': address}, function(results, status) {
     if (status == 'OK') {
       map.setCenter(results[0].geometry.location);
       var marker = new google.maps.Marker({
           map: map,
           position: results[0].geometry.location
       });
     } else {
       var msg;
       // Status codes are documented at https://developers.google.com/maps/documentation/geocoding/intro#StatusCodes
       switch(status) {
          case 'ZERO_RESULTS':
            msg = "We could not find '" + address + "'";
            break;
          case 'UNKNOWN_ERROR':
            msg = "The map server is busy, try again later.";
            break;
          default:
            msg = "Unknown error, refresh your web browser";
       }
       alert(msg);
     }
   });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}