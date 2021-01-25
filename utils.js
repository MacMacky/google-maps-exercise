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


const removePlots = () => {
  plots.forEach(plot => {
    plot && plot.setMap(null);
  });
  plots = [];
}