"use strict";

/**
 * mapStateSync
 *
 * Saves current map-view in localStorage, so multiple windows can have the same view.
 */
angular.module("dashboards").directive("mapStateSync", [
  function() {
    function link(scope, element) {
      var storage = detectStorageFeature();
      var STORAGE_KEY = "mapState";
      var thisActor = Date.now();
      var mapObject;
      var mapState;

      /**
       * @param {Event} event
       */
      function toggleSyncState(event) {
        if (event.target.checked) {
          return enableSync();
        }

        disableSync();
      }

      function enableSync() {
        // Set it here, to be sure the map is initialized/loaded
        mapObject = scope.map;
        mapState = {
          author: thisActor,
          zoom: mapObject.getZoom(),
          center: mapObject.getCenter(),
        };

        mapObject.on("movestart", onStart);
        mapObject.on("moveend", onChange);
        window.addEventListener("storage", onUpstreamChange);
      }

      function disableSync() {
        mapObject.off("movestart", onStart);
        mapObject.off("moveend", onChange);
        window.removeEventListener("storage", onUpstreamChange);
      }

      function onStart() {
        mapState.author = thisActor;
      }

      /**
       * Happens on EVERY change to the map, by THIS actor and the upstream actor(s)
       *
       * @param {Event} event
       */
      function onChange(event) {
        // Prevent an infinite loop of change->set->store->change->set->store->∞
        // Only continue if it was triggered by THIS actor
        if (mapState.author !== thisActor) {
          return;
        }

        var newState = {
          author: thisActor,
          zoom: event.target.getZoom(),
          center: event.target.getCenter(),
        };

        mapState = newState;
        storeMapState(newState);
      }

      /**
       * @param {Object} state
       * @param {Number} state.author
       * @param {Number} state.zoom
       * @param {Object} state.center
       * @param {Number} state.center.lat
       * @param {Number} state.center.lng
       */
      function storeMapState(state) {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      /**
       *
       * @param {StorageEvent} event
       */
      function onUpstreamChange(event) {
        // Only act on valid changes by this directive
        if (event.key !== STORAGE_KEY || !event.newValue) {
          return;
        }

        var newState = JSON.parse(event.newValue);

        // Check if the change REALLY comes from upstream
        // If it is triggered by THIS actor, abort.
        if (newState.author === thisActor) {
          return;
        }

        mapState = newState;
        renderMapState(newState);
      }

      /**
       * @param {Object} state
       * @param {Number} [state.author]
       * @param {Number} state.zoom
       * @param {Object} state.center
       * @param {Number} state.center.lat
       * @param {Number} state.center.lng
       */
      function renderMapState(state) {
        mapObject.stop().setView(state.center, state.zoom, {
          animate: false,
          noMoveStart: true,
        });
      }

      /**
       * See: https://mathiasbynens.be/notes/localstorage-pattern
       */
      function detectStorageFeature() {
        var uid = new Date();
        var storage;
        var result;

        try {
          (storage = window.localStorage).setItem(uid, uid);
          result = storage.getItem(uid) == uid;
          storage.removeItem(uid);

          return result && storage;
        } catch (exception) {
          return false;
        }
      }

      function init() {
        if (!storage) {
          return element.hide();
        }

        var toggle = element.find('input[name="map-state-sync"]');

        toggle.on("change", toggleSyncState);
      }

      init();
    }

    return {
      link: link,
    };
  },
]);
