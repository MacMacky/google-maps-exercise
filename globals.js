const log = console.log;
const MAIN_URL = 'https://maps.googleapis.com/maps/api';
let plots = [], contained_restaurants = [];
let service,
  direction_service,
  direction_renderer,
  map,
  cuisine = '',
  type = '',
  shape_info_window = null,
  details_info_window = null,
  rectangle = null,
  circle = null;;
