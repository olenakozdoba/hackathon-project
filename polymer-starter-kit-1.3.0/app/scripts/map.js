  // Note: This example requires that you consent to location sharing when
  // prompted by your browser. If you see the error "The Geolocation service
  // failed.", it means you probably did not give permission for the browser to
  // locate you.function initMap() {
function initMap() {
  google.maps.InfoWindow.prototype.isOpened = false;

  var map = new google.maps.Map(document.getElementById('chargemap'), {
    center: {lat: 34.146, lng: -118.130},//34.1463769,-118.1298394
    zoom: 15
  });
  
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
	  
	  var image = 'http://i.stack.imgur.com/orZ4x.png';
	  var marker = new google.maps.Marker({
		  position: pos,
		  map: map,
		  icon: image
	  });  
	  marker.setMap(map);
      map.setCenter(pos);

      var ref = new Firebase("https://easychargeapp.firebaseio.com");
	  
	  var spotRef = ref.child("Spot");
	  
	  spotRef.on("value", function(snapshot) {
	  
		  var spots = [];
		  snapshot.forEach(function(data) {
			spots.push({"key" : data.key(), "address" : data.val()["address"], "price" : data.val()["price"]});
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
  $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address='+spot.address+'&sensor=false', null, function (data) {
    var p = data.results[0].geometry.location
    var latlng = new google.maps.LatLng(p.lat, p.lng);
	
	var spotRef = new Firebase("https://easychargeapp.firebaseio.com/Spot");
	  
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
		  content: '<p>' + spot.address + '<br>$' + spot.price + ' per hour</p> <button onclick="reserveButtonClicked(\''+spot.key+'\', true)">Reserve</button>'
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
		  content: '<p>' + spot.address + '<br>$' + spot.price + ' per hour</p> <button onclick="reserveButtonClicked(\''+spot.key+'\', false)">Release</button>'
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
	var spotRef = new Firebase("https://easychargeapp.firebaseio.com/Spot");
	
	var addressRef = spotRef.child(spotKey);
	
	if(!isReserving){
		addressRef.on("value", function(snapshot) {
		  var startTime = snapshot.val()["startTime"];
		  if(startTime != 0)
		  {
			  var duration =  Math.round(new Date().getTime()/1000) - startTime ;
			  alert("You have used the spot for "+ duration+" seconds");
		  }
		}, function (errorObject) {
		  console.log("The read failed: " + errorObject.code);
		});
	}
	
	addressRef.update({
	  "status": isReserving ? 1 : 0,
	  "startTime": isReserving ? Math.round(new Date().getTime()/1000) : 0
	});
	
	location.reload();
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}