let cachedResult = {};
let rerenderData = true;
let intervalId;
let updateElementProperties;
let autoRefresh = true;
const dataRefreshIntervalMs = 250;

// Get & apply settings from local storage
chrome.storage.sync.get('settings', (data) => {
  if (!data.settings || data.settings.autoRefresh === false) {
    autoRefresh = false;
  }
});

// Listen for changes in settings from local storage & apply the effects
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings?.newValue) {
    autoRefresh = Boolean(changes.settings.newValue.autoRefresh);

    if (autoRefresh === false && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else if (!intervalId) {
      intervalId = setInterval(updateElementProperties, dataRefreshIntervalMs);
    }
  }
});

// Computes the properties and its values of the selected polymer or lit component
const computeComponentProperties = () => {
  if ($0) {
    if ($0.__data__ || $0.__data) {
      // Polymer element

      /**
       * Safely handles circular dependencies. If the current iterated value is a non-null object, check if the prototype is
       * different than the default Object.prototype. Discard if it's the same (we don't need them). Cache the objects in the local
       * cache variable, and check for object duplicates, so we avoid circular dependencies, which break the JSON compliancy.
       */
      const stringify = (val, depth, replacer, space) => {
        depth = isNaN(+depth) ? 1 : depth;
        function _build(key, val, depth, o, a) { // (JSON.stringify() has it's own rules, which we respect here by using it for property iteration)
          return !val || typeof val != 'object' ? val : (a = Array.isArray(val), JSON.stringify(val, function (k, v) { if (a || depth > 0) { if (replacer) v = replacer(k, v); if (!k) return (a = Array.isArray(v), val = v); !o && (o = a ? [] : {}); o[k] = _build(k, v, a ? depth : depth - 1); } }), o || (a ? [] : {}));
        }
        return JSON.stringify(_build('', val, depth), null, space);
      }

      const tagName = $0.localName;
      const selectedElementClass = window.customElements.get(tagName);

      const alternativeData = {}
      if (selectedElementClass) {
        const classPropertiesMap = selectedElementClass.properties;
        if (classPropertiesMap && typeof classPropertiesMap === 'object') {
          const props = Object.keys(classPropertiesMap).sort();

          for (const prop of props) {
            alternativeData[prop] = $0[prop];
          }
        }
      }

      const data = Object.assign({}, $0.__data, $0.__data__, alternativeData);

      // Attempt a regular stringification. If it succeeds, return it quickly. Otherwise, try to stringify its props. If some fail, limit the depth of stringification.
      let stringifiableData = {};
      try {
        JSON.stringify(data);
        stringifiableData = data;
      } catch (error) {
        for (const dataKey in data) {
          let stringifiedDataValue;
          let limitedStringification = false;
          let isLimitedDataValueAnArray = false;
          try {
            stringifiedDataValue = JSON.stringify(data[dataKey]);
          } catch (error) {
            stringifiedDataValue = stringify(data[dataKey], 6);
            limitedStringification = true;
            if (Array.isArray(data[dataKey])) {
              isLimitedDataValueAnArray = true;
            }
          }

          if (stringifiedDataValue) {
            stringifiableData[dataKey] = JSON.parse(stringifiedDataValue);
            if (limitedStringification) {
              if (isLimitedDataValueAnArray) {
                stringifiableData[dataKey].unshift("$ LIT-PRISM MESSAGE: This data value has been truncated to only a few levels deep, since it contains a circular reference and cannot be stringified.");
              } else {
                stringifiableData[dataKey]["$ LIT-PRISM MESSAGE"] = "This data value has been truncated to only a few levels deep, since it contains a circular reference and cannot be stringified.";
              }
            }
          } else {
            stringifiableData[dataKey] = 'undefined';
          }
        }
      }

      return stringifiableData;
    } else {
      // Lit element
      const tagName = $0.localName;
      const selectedElementClass = window.customElements.get(tagName);

      if (selectedElementClass) {
        const classPropertiesMap = selectedElementClass._classProperties;
        const elementProperties = selectedElementClass.elementProperties;

        if (classPropertiesMap) {
          // Lit v1 element
          const data = {}
          classPropertiesMap.forEach((element, key) => {
            data[key] = $0[key];
          });
          return data;
        } else if (elementProperties && elementProperties.size) {
          // Lit v2 element
          const data = {}
          elementProperties.forEach((element, key) => {
            data[key] = $0[key];
          });
          return data;
        } else {
          // Perhaps native webcomponent... check proto stuff
          // const miscProps = [...new Set(Object.getOwnPropertyNames($0).concat(Object.getOwnPropertyNames($0.__proto__)))];
          const miscProps = Object.getOwnPropertyNames($0.__proto__);

          if (miscProps.length) {
            const data = {}
            miscProps.forEach((key) => {
              data[key] = $0[key];
            });
            return data;
          } else {
            // Might still not be a Lit element
            return { message: 'The selected element is neither a Lit v1 nor Lit v2 nor a Polymer webcomponent.' };
          }
        }
      } else {
        // Neither a Polymer nor a Lit element
        return { message: 'The selected element is not a webcomponent.' };
      }
    }
  }
};

// Callback method of the sidebar pane creation method. Sets the object in the sidebar pane, if it changed from the one cached.
const createSidebarPaneCallback = (sidebar) => {
  // Update element properties
  updateElementProperties = () => {
    chrome.devtools.inspectedWindow.eval("(" + computeComponentProperties + ")()", (result, isException) => {
      if (isException) {
        if (JSON.stringify(cachedResult) !== JSON.stringify(isException)) {
          rerenderData = true;
        }
        cachedResult = isException;
      } else {
        if (JSON.stringify(cachedResult) !== JSON.stringify(result)) {
          rerenderData = true;
        }

        cachedResult = result;
      }

      if (rerenderData) {
        sidebar.setObject(cachedResult);
        rerenderData = false;
      }


      if (!intervalId && autoRefresh) {
        // Update data periodically
        intervalId = setInterval(updateElementProperties, dataRefreshIntervalMs);
      }
    });
  };

  clearOldAndUpdateElementProperties = (sidebar) => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    updateElementProperties(sidebar);
  };

  panels.elements.onSelectionChanged.addListener(clearOldAndUpdateElementProperties);
};

const panels = chrome && chrome.devtools && chrome.devtools.panels;
panels && panels.elements.createSidebarPane("Lit Prism", createSidebarPaneCallback);