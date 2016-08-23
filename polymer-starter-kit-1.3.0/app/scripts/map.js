  // Note: This example requires that you consent to location sharing when
  // prompted by your browser. If you see the error "The Geolocation service
  // failed.", it means you probably did not give permission for the browser to
  // locate you.function initMap() {
function initMap() {
  var map = new google.maps.Map(document.getElementById('chargemap'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 15
  });
  var infoWindow = new google.maps.InfoWindow({map: map});
  
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      infoWindow.setContent('Location found.');
      map.setCenter(pos);

      var ref = new Firebase("https://easychargeapp.firebaseio.com");
	  
	  var spotRef = ref.child("Spot");
	  
	  spotRef.on("value", function(snapshot) {
	  
		  var addresses = [];
		  snapshot.forEach(function(data) {
			addresses.push(data.val()["address"]);
		  });
		
		  for (var x = 0; x < addresses.length; x++) {
			  $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address='+addresses[x]+'&sensor=false', null, function (data) {
				  var p = data.results[0].geometry.location
				  var latlng = new google.maps.LatLng(p.lat, p.lng);
				  new google.maps.Marker({
					  position: latlng,
					  map: map
				  });

			  });
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

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}