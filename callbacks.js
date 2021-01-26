
const nearbySearchCallback = (results, status, pagination) => {
  if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
    results
      .filter(r => filterByRestaurant(r.types))
      .forEach(data => {
        // add to plots list
        plots.push(createPlot(data));
        restaurant_data.push(data)
      })
    if (pagination.hasNextPage) {
      setTimeout(() => {
        pagination.nextPage()
      }, 2000) // 2 seconds base on the documentation
    }
  }
}

// getDetails higher order callback
const getDetails = ({ distance, origin, infoWindow, renderer, map, destination }) => {
  return (result, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // open details info window
      openInfoWindow({
        infoWindow,
        content: `The nearest restaurant is ${result.name}. The distance is ${distance} meters.`,
        position: origin,
        map
      })
      direction_service.route({ destination, origin, travelMode: google.maps.TravelMode.DRIVING }, (response, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          renderer.setDirections(response)
        }
      })
    }
  }
}
