"use strict";

angular.module("dashboards").factory("geoLayersService", [
  function() {
    /**
     * Create markers for POI-layers
     */
    function createMarker(item, itemTitle, itemClass) {
      return L.marker(item.geometry.coordinates, {
        keyboard: true,
        riseOnHover: true,
        title: itemTitle,
        icon: L.divIcon({
          iconSize: [20, 20],
          iconAnchor: [10, 20],
          popupAnchor: [0, 0],
          className: "marker-icon marker-icon--" + itemClass,
        }),
      });
    }

    function show_locations(poi_layer, map) {
      map.addLayer(poi_layer);
    }
    function hide_locations(poi_layer, map) {
      map.removeLayer(poi_layer);
    }

    function toggle_poi_layer(layer, toggled, layers, map) {
      if (typeof toggled[layer] == "undefined") {
        toggled[layer] = true;
      } else {
        toggled[layer] = !toggled[layer];
      }
      var layer_full = layer + "LocationsLayer";
      if (toggled[layer]) {
        show_locations(layers[layer_full], map);
      } else {
        hide_locations(layers[layer_full], map);
      }
    }

    return {
      createMarker: createMarker,
      toggle_poi_layer: toggle_poi_layer,
    };
  },
]);
