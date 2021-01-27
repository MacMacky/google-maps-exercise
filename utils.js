const filterByRestaurant = (types = []) => {
  return types.includes('restaurant');
}

const openInfoWindow = ({ infoWindow, content, marker, map, position = null }) => {
  infoWindow.setContent(content);
  // check if position is a `LatLng` object
  if (position && position instanceof google.maps.LatLng) {
    infoWindow.setPosition(position);
    infoWindow.open(map);
  } else {
    infoWindow.open(map, marker);
  }
  infoWindow.isOpen = true;
}

const closeInfoWindow = ({ infoWindow }) => {
  infoWindow.isOpen = false;
  infoWindow.close();
}

const compareRatings = (place_id, restaurant_rating) => {
  return restaurant_data
    .filter(restaurant => restaurant.place_id !== place_id)
    .map(r => r.rating)
    .reduce((acc, curr) => {
      // check if `current` rating is equal
      if (curr === restaurant_rating) {
        return {
          ...acc,
          equal: acc.equal + 1
        }
      }
      // check if `current` rating is lower
      if (curr < restaurant_rating) {
        return {
          ...acc,
          lower: acc.lower + 1
        }
      }
      // this should be higher
      return {
        ...acc,
        higher: acc.higher + 1
      }
    }, {
      lower: 0,
      higher: 0,
      equal: 0
    })
}

const getNoun = (len = 0) => {
  return {
    many: len === 1 ? 'is' : 'are',
    length: len === 1 ? '' : 's'
  }
}

const removePlots = () => {
  plots.forEach(plot => {
    plot && plot.setMap(null);
  });
  plots = [], restaurant_data = [];
};

const makeContent = ({ image, name, rating, formatted_address, higher, lower, equal, visited, placeId }) => {
  return `<div class="info-container">
  <p>
    ${image}
  </p>
   <h5>${name}</h5>
   <p><strong>Rating</strong>: ${rating}</p>
   <p><strong>Address</strong>: ${formatted_address}</p>
   <p><strong>Restaurants with Higher Rating</strong>: ${higher}</p>
   <p><strong>Restaurants with Lower Rating</strong>: ${lower}</p>
   <p><strong>Restaurants with Equal Rating</strong>: ${equal}</p>
   <p><strong>Times visited:</strong> ${visited}</p>
   <button id="direction" style="display:block;margin:0 auto;" data-placeid=${placeId}> Show location to the nearest restaurant.</button >
</div > `
};


const getNearestRestaurant = (from, place_id = null) => {
  return plots.reduce((acc, { position, place }) => {
    // compute the distance between two `latLng` to 
    // get the nearest restaurant base on the `position` click
    const distance = google.maps.geometry.spherical.computeDistanceBetween(from, position);
    // check if current `distance` is lower the than old `distance`
    if (place_id) {
      if (distance < acc.distance && place.placeId !== place_id) {
        return {
          distance,
          placeId: place.placeId,
          position
        }
      } else {
        return acc;
      }
    }

    if (distance < acc.distance) {
      return {
        distance,
        placeId: place.placeId,
        position
      }
    }
    return acc;
  }, { distance: Number.MAX_VALUE, placeId: null, position: null });
}

