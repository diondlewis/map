// Encapsulate code in function that is called when the google api is loaded
function app() {
	var GOOGLE_MAP_API = "AIzaSyDs55Zpapu2eoekpKcKxhsh9UIzmIYKzVE";
	var GEOCODE_API = "AIzaSyD7rfnDJMnuQAHZFWfu-m2-pGaJrZ6R3sA";
	var WHITNEY_YOUNG_HIGH_SCHOOL = {lat: 41.8783, lng: -87.6636};// Maps center
	var coordinates = [];
	var names = [];
	var locationDescription = ["lake","planetarium","museum","art","aquatic","skyscraper","music","stadium"];
	var locations = [];
	var siteLocation = {};
	var amount = 0;
	// Siteseeing Locations
	var addresses = {
		"Navy Pier" : "600 E Grand Ave, Chicago, IL 60611",
		"Adler Planetarium" : "Museum Campus, 1300 S Lake Shore Dr, Chicago, IL 60605",
		"The Field Museum" : "1400 S Lake Shore Dr, Chicago, IL 60605",
		"The Art Institute of Chicago" : "111 S Michigan Ave, Chicago, IL 60603",
		"Shedd Aquarium" : "1200 S Lake Shore Dr, Chicago, IL 60605",
		"Willis Tower" : "233 S Wacker Dr, Chicago, IL 60606",
		"Symphony Center" : "220 S Michigan Ave, Chicago, IL 606041",
		"United Center" : "1901 W Madison St, Chicago, IL 60612"
	};

	var map;
	var markers = {};
	var infoWindows = {};

	// Initalizes the map
	function initMap() {
		var mapOptions = {
			center: WHITNEY_YOUNG_HIGH_SCHOOL,
			scrollwheel:false,
			zoom: 12
		};
		map = new google.maps.Map(document.getElementById('map'), mapOptions);
		// As the window resizes the center of the map follows the center of the screen
		google.maps.event.addDomListener(window, 'resize', function() {
			var c = map.getCenter();
			google.maps.event.trigger(map, 'resize');
			map.setCenter(c);
		});
	}

	// Initialize the map
	initMap();

	// Adds bounce animation to a map marker
	function bounceMarker(marker) {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		// 700 ms per bounce of the marker
		setTimeout(function() {
			marker.setAnimation(null);
		}, 1400);
	}

	// Map marker object which also opens the infoWindow
	var Marker = function(ll, name) {
		this.name = name;
		this.lat = ll.lat;
		this.lng = ll.lng;
		this.marker = new google.maps.Marker({
			map : map,
			position: ll
		});
		// InfoWindow content is updated with FourSquare data upon foursquare api return
		var info = new google.maps.InfoWindow({
			content: '<div>FourSquare content failed to load.</div>',
			minWidth: 300
		});
		// Store infowindow in a global object so it can be referenced when it needs to be placed or removed
		infoWindows[name] = info;
		this.marker.addListener('click', (function(marker, infowindow){
			return function() {
				if(markers[name].marker.getIcon() === null) {
					infowindow.open(map, marker);
					markers[name].marker.setIcon({path:google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6});
					bounceMarker(marker);
				} else {
					infowindow.close(map, marker);
					markers[name].marker.setIcon(null);
				}
				viewModel.locationsView.click(siteLocation[name]);
			};
		})(this.marker, info));
		// The map marker and list view close when the infowindow is closed.
		google.maps.event.addListener(info, 'closeclick', function() {
			viewModel.locationsView.click(siteLocation[this.name]);
		}.bind(this), false);
	};

	// Handles the  FourSquare data
	var fourSquareAPI = {
		// API settings
		setup : {
			url : 'https://api.foursquare.com/v2/venues/search',
			id : '?client_id=FZUPQC20HLN4WT3WQVMWM3BGLQTIAIQ3R0CMQ0A3FGENW0T4',
			secret : '&client_secret=DWOQ0ANXRK2T4V0XNJVHQPQZQMZM4JBFH4KRFKN2EKDHVL20',
			version : '&v=20161122'
		},
		// Makes the AJAX request and inputs the corresponding information into the infoWindow
		query : function(latlng, name, addr) {
			var ll = '&ll=' + latlng.lat + ',' + latlng.lng;
			var query = '&query=' + name;
			var fs_url = this.setup.url + this.setup.id + this.setup.secret + this.setup.version + ll + query;
			(function(locationName, addr) {
				$.getJSON(fs_url, function(data) {
					var site = data.response.venues[0].url;
					var phone = data.response.venues[0].contact.formattedPhone;
					var name = data.response.venues[0].name;
					infoWindows[locationName].setContent(fourSquareAPI.buildContent(name, addr, phone, site));
				}).fail(function() {
					console.log("Error communicating with FourSquare API");
					infoWindows[locationName].setContent(fourSquareAPI.buildContent(null));
				});
			})(name, addr);
		},
		// Formats the data returned from the API call
		buildContent : function(name, addr, phone, site) {
			// Will only create formatted data structure if the place exists
			if(name != null) {
				var address = '<p>Address: ' + addr + '</p>';
				var link = '<a href="' + site + '">' + site + '</a>';
				if(site == null) {
					site = 'No website listed';
					link = 'No website listed';
				}
				if(phone == null) {
					phone = 'No phone number listed';
				}
				var pnum = '<p>Phone: ' + phone + '</p>';
				var wsite = '<p>Website: ' + link + '</p>';
				var content = '<div><h1>' + name + '</h1>' + address + pnum + wsite + '</div>';
				return content;
			} else {
				var error = '<div><h1>Foursquare has encountered an error displaying information for this location.</h1></div>';
				return error;
			}
		},
		// Initalizes the FourSquare API handling process
		init : function() {
			for(var place in addresses) {
				fourSquareAPI.query(WHITNEY_YOUNG_HIGH_SCHOOL, place, addresses[place]);
			}
		}
	};

	//Get the Lat/Lng coordinates for each address using the geocode API
	var apiHandler = {

		handleDefaultLoc : function(obj) {
			var uri = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
			var key = '&key=' + GEOCODE_API;
			var gpsCoords = [];
			for(var item in addresses) {
				names.push(item);
				amount++;
				var addr = addresses[item];
				var url = uri + addr + key;
				// This function handles the async request of the geocode api.
				(function(index) {
					$.getJSON(url, function(data) {
						var obj = {};
						if(data.status == "OK") {
							var d = data.results[0].geometry.location;
							obj.name = index;
							obj.lat = d.lat;
							obj.lng = d.lng;
							obj.addr = data.results[0].formatted_address;
							var marker = new Marker({lat:obj.lat,lng:obj.lng}, index);
							markers[index] = marker;
							gpsCoords.push(obj);
						} else {
							//console.log("error calling google api");
							$("#map").append('<div>Failed to connect to Google servers.</div>');
						}
					});
				})(item);
			}
			return gpsCoords;
		},
		//Construct the locations observable array to be placed into the locationsViewModel
		buildDefaultLoc : function() {
			for(i = 0; i < amount; i++) {
				var object = {};
				object.name = names[i];
				object.type = "restaurant";
				object.description = locationDescription[i];
				// Keeps track of when the item is clicked.
				object.clicked = ko.observable(false);
				// Determines if the item clicked is a match.
				object.match = ko.observable(true);
				locations.push(object);
				siteLocation[object.name] = object;
			}
		},
		// Initalize the API for geocode
		init : function() {
			coordinates = this.handleDefaultLoc(addresses);
			this.buildDefaultLoc();
		}
	};

	apiHandler.init();

	// View model for the locations listed under the search bar.
	function locationsViewModel() {
		var self = this;
		// Observable array for the locations
		self.places = ko.observableArray(locations);
		// If an item is clicked, then toggle its corresponding infoWindow on the map
		self.infoWindows = function(index, locationName) {
			var click = self.places()[index].clicked();
			if(click) {
				infoWindows[locationName].open(map, markers[locationName].marker);
				markers[locationName].marker.setIcon({path:google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6});
				bounceMarker(markers[locationName].marker);
			} else {
				infoWindows[locationName].close();
				markers[locationName].marker.setIcon(null);
			}
		};
		// Click notifier
		self.click = function(place) {
			var index = self.places().indexOf(place);
			var locationName = place.name;
			self.onePlace(locationName);
			self.places()[index].clicked(!place.clicked());
			self.infoWindows(index, locationName);
		};
		// Hide/Show the menu when the hamburger icon is clicked
		self.hideMenu = function() {
			$('.item').toggleClass('to-the-left');
		};
		// Allow the named places to stay selected.
		self.onePlace = function(name) {
			for(i = 0; i < 8; i++) {
				var locationName = self.places()[i].name;
				if(name !== locationName && self.places()[i].clicked()) {
					self.click(siteLocation[locationName]);
				}
			}
		}
	}

	// View model for the search bar
	function searchViewModel() {
		var self = this;
		// The search input field is actively updated per user input
		self.search = ko.observable('');
	}

	// Parent View model for the searchView and the locationsView models.
	// Allows for communication between the searchView and the locationsView models
	var viewModel = {
		locationsView : new locationsViewModel(),
		searchView : new searchViewModel(),
		// Apply the bindings for the view models
		init : function() {
			ko.applyBindings(viewModel);
		},
		// Compare and contrasts the user input to the names of the locations
		compareSearch : function(index) {
			var searchString = viewModel.searchView.search();
			var name = viewModel.locationsView.places()[index].name;
			var nlowercase = name.toLowerCase();
			var slowercase = searchString.toLowerCase();
			// Conditional checks to see if marker exists utilize a loose
			if(nlowercase.indexOf(slowercase) > -1 || searchString.length === 0) {
				viewModel.locationsView.places()[index].match(true);
				if(markers[name] != null) {
					markers[name].marker.setMap(map);
				}
			} else {
				viewModel.locationsView.places()[index].match(false);
				if(markers[name] != null) {
					markers[name].marker.setMap(null);
				}
			}
			return viewModel.locationsView.places()[index].match();
		}
	};

	viewModel.init();
	fourSquareAPI.init();
}
