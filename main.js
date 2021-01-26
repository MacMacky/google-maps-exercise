const markerClickCallback = ({ marker, service, map, infoWindow, placeId }) => {
  return () => {
    if (marker.getAnimation() !== null) {
      // stop the animation or in this case stop the 'bouncing'
      marker.setAnimation(null);
      // close info window
      closeInfoWindow({ infoWindow })
    } else {
      // pan to 'clicked' restaurant    
      map.panTo(new google.maps.LatLng(marker.position.lat(), marker.position.lng()))
      // request params
      const params = { placeId }
      // set animation to bounce
      marker.setAnimation(google.maps.Animation.BOUNCE);
      // get times visited from `localStorage`
      let visited = Number(localStorage.getItem(`${placeId}_visited`));
      // increment visited
      visited += 1;
      // updated visited time to localStorage
      localStorage.setItem(`${placeId}_visited`, visited);
      // check if `place` details already exists in localStorage
      // if (localStorage.getItem(`${placeId}_details`)) {
      //   const [name, formatted_address] = localStorage.getItem(`${placeId}_details`).split(':');
      //   openInfoWindow({
      //     map,
      //     marker,
      //     content: `${[name, ...formatted_address.split(','), `<strong>Times visited: ${visited}</strong>`].join('<br>')}`,
      //     infoWindow
      //   });
      //   return;
      // }
      // get details from api
      service.getDetails(params, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const { name, formatted_address, rating, formatted_phone_number } = place;

          log(rating, restaurant_data.filter(restaurant => restaurant.place_id !== place.place_id)
            .map(r => r.rating))

          const { lower, higher, equal } = compareRatings(place.place_id, rating);
          const low = getNoun(lower);
          const high = getNoun(higher);
          const eq = getNoun(equal);

          const lower_message = `<strong>There ${low.many} ${lower} restaurant${low.length} with a lower rating.</strong>`
          const higher_message = `<strong>There ${high.many} ${higher} restaurant${high.length} with a higher rating.</strong>`
          const eq_message = `<strong>There ${eq.many} ${equal} restaurant${eq.length} with the same rating.</strong>`


          // open info window
          openInfoWindow({
            map,
            marker,
            content: `${[`<h5>${name}</h5>`, ...formatted_address.split(','), eq_message, higher_message, lower_message, `<strong>Times visited: ${visited}</strong>`].join('<br>')}`,
            infoWindow
          });
          // save `place` details for caching purposes
          localStorage.setItem(`${placeId}_details`, `${name}:${formatted_address}`)
        }
      })
    }
  }
}

const createPlot = (place) => {
  const { geometry: { location }, place_id: placeId, types } = place;
  // check if item does exists in `localStorage`
  if (!localStorage.getItem(`${placeId}_visited`))
    localStorage.setItem(`${placeId}_visited`, 0)
  // make InfoWindow instance
  const infoWindow = new google.maps.InfoWindow();
  // make Marker instance for plot
  const marker = new google.maps.Marker({
    position: {
      lat: location.lat(),
      lng: location.lng()
    },
    animation: google.maps.Animation.DROP,
    icon: {
      url: './restaurant-icon.png',
      scaledSize: new google.maps.Size(50, 50),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 0)
    },
    place: {
      location,
      placeId
    }
  });
  // create service
  const service = new google.maps.places.PlacesService(map);
  // put marker on map
  marker.setMap(map);
  // add `click` listener
  marker.addListener('click', markerClickCallback({
    marker,
    service,
    infoWindow,
    map,
    placeId
  }));
  // return marker for reference
  return marker
}

document.addEventListener('DOMContentLoaded', () => {
  // create script element
  const new_script = document.createElement('script');
  // attach new script element to head element
  document.head.appendChild(new_script);
  // wait for the 'load' event on the script element
  new_script.addEventListener('load', () => {
    // create `map` instance
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 10.31672,
        lng: 123.89071
      },
      zoom: 18
    });
    // add new property `isOpen` to InfoWindow prototype 
    google.maps.InfoWindow.prototype.isOpen = false;
    // info windows
    details_info_window = new google.maps.InfoWindow();
    shape_info_window = new google.maps.InfoWindow();
    // services
    service = new google.maps.places.PlacesService(map);
    direction_service = new google.maps.DirectionsService();

    // direction renderer
    direction_renderer = new google.maps.DirectionsRenderer();
    // set renderer map
    direction_renderer.setMap(map);

    // search api
    const search = (cuisine, type) => {
      return service.nearbySearch({
        location: {
          lat: 10.31672,
          lng: 123.89071
        },
        type: 'restaurant',
        radius: 50000,
        key: API_KEY,
        keyword: `${cuisine} ${type}`
      }, nearbySearchCallback);
    }

    document.getElementById('cuisine').addEventListener('change', ({ target: { value } }) => {
      cuisine = value;
      if (cuisine && type) {
        removePlots();
        search(cuisine, type)
      }
    });

    document.getElementById('type').addEventListener('change', ({ target: { value } }) => {
      type = value;
      if (cuisine && type) {
        removePlots();
        search(cuisine, type)
      }
    });

    document.getElementById('rectangle').addEventListener('change', () => {
      // close info window if it's open
      if (shape_info_window.isOpen) {
        closeInfoWindow({ infoWindow: shape_info_window })
      }
      // remove circle from map
      if (circle) {
        circle.setMap(null);
      }
      if (!rectangle) {
        rectangle = new google.maps.Rectangle({
          editable: true,
          draggable: true
        });
      }
      // display the `rectangle` to the center of the map
      rectangle.setBounds(new google.maps.Circle({ radius: 25, center: map.getCenter() }).getBounds())
      rectangle.setMap(map);
      // add listener when the `rectangle` is resized or dragged
      rectangle.addListener('bounds_changed', () => {
        if (plots.length) {
          contained_restaurants = [];
          plots.forEach(({ position, place }) => {
            // check if a `place`s lantitude and longitude is within the `rectangle`
            if (rectangle.getBounds().contains(position)) {
              // check if a `place` id's does not exists on the `contained_restaurants` array 
              if (!contained_restaurants.includes(place.placeId)) {
                contained_restaurants.push(place.placeId);
              }
            }
          });
          const len = contained_restaurants.length;
          openInfoWindow({
            infoWindow: shape_info_window,
            content: `There ${len === 1 ? 'is' : 'are'} ${len} restaurant${len === 1 ? '' : 's'} in the rectangle.`,
            map,
            position: rectangle.getBounds().getCenter()
          })
        }
      })
    });
    document.getElementById('circle').addEventListener('change', () => {
      // close info window if it's open
      if (shape_info_window.isOpen) {
        closeInfoWindow({ infoWindow: shape_info_window })
      }
      // remove rectangle from map
      if (rectangle) {
        rectangle.setMap(null);
      }

      if (!circle) {
        circle = new google.maps.Circle({
          editable: true,
          draggable: true,
          center: map.getCenter(),
        });
      }

      circle.setRadius(25);
      circle.setMap(map);

      const circleEventCallback = () => {
        if (plots.length) {
          contained_restaurants = [];
          plots.forEach(({ position, place }) => {
            // check if a `place`s lantitude and longitude is within the `circle`
            if (circle.getBounds().contains(position)) {
              // check if a `place` id's does not exists on the `contained_restaurants` array 
              if (!contained_restaurants.includes(place.placeId)) {
                contained_restaurants.push(place.placeId);
              }
            }
          });
          const len = contained_restaurants.length;

          openInfoWindow({
            infoWindow: shape_info_window,
            content: `There are ${len} restaurant${len === 1 ? '' : 's'} in the circle.`,
            map,
            position: circle.getCenter()
          })
        }
      }
      // event when the `circle` is resized
      circle.addListener('radius_changed', circleEventCallback);
      // event when the `circle` is dragged so the circle's `center` is changed
      circle.addListener('center_changed', circleEventCallback);
    });


    map.addListener('click', ({ latLng }) => {
      // check if `details` info window is currently opens
      if (details_info_window.isOpen) {
        closeInfoWindow({ infoWindow: details_info_window })
      }
      // check if `plots` has data
      if (plots.length) {
        const { distance, placeId, position } = plots.reduce((acc, { position, place }) => {
          // compute the distance between two `latLng` to 
          // get the nearest restaurant base on the `position` click
          const distance = google.maps.geometry.spherical.computeDistanceBetween(latLng, position);
          // check if current `distance` is lower the than old `distance`
          if (distance < acc.distance) {
            return {
              distance,
              placeId: place.placeId,
              position
            }
          }
          return acc;
        }, { distance: Number.MAX_VALUE, placeId: null });
        // get the details of the `nearest` restaurant
        service.getDetails({ placeId }, getDetails({ map, distance, origin: latLng, destination: position, infoWindow: details_info_window, renderer: direction_renderer }));

      }
    })

  })
  new_script.src = `${MAIN_URL}/js?key=${API_KEY}&libraries=places,geometry`
})
