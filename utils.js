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
}