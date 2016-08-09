# Project 5: Neighborhood Map

This project is a neighborhood map of some of my favorite places in downtown Chicago, Illinois, USA. To run the application you can navigate in your browser to http://diondlewis.github.io/map. You can also clone or download the repository to your computer. Since this map uses Google Map API to render the map and create the location markers you will need to be connected to the internet for the map to render on the page.

## Map Features

### Markers
Clicking on a map marker will animate the marker and open an info window just above the marker. Using a FourSquare API, an AJAX call returns the location's name, phone number and website and populates the information into the info window that appears.  Clicking on the marker also highlights the corresponding location in the list view located on the left of the page. If for any reason the FourSquare API fails, the user will be alerted that the request failed.

### List View

The list view contains a list of the locations that correspond to the  markers on the map. Similar to clicking on a marker, clicking on a location in the list view will animate the marker and open an info window with the information received from the FourSquare API populated inside of it.

The list view can be hidden by clicking the hamburger icon in the "Chicago Siteseeing Locations" bar.

### Search Bar

The search bar can be used to filter the locations in the list view and the markers that are displayed on the map. When the user enters a location into the search bar only the location that matches the users search will be displayed in the list view, with the corresponding marker displayed on the map. If the user input does not match any of the locations on the map no markers will be displayed and no locations will appear under the list view.

## Addional Information

Code is separated based upon Knockout.js best practices. It follows an MVVM pattern, using observables rather than forcing refreshes manually.
