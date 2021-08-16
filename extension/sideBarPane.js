const panels = chrome && chrome.devtools && chrome.devtools.panels;

const computeComponentProperties = () => {
  if ($0) {
    if ($0.__data__ || $0.__data) {
      // Polymer element

      /**
       * Safely handles circular dependencies. If the current iterated value is a non-null object, check if the prototype is
       * different than the default Object.prototype. Discard if it's the same (we don't need them). Cache the objects in the local
       * cache variable, and check for object duplicates, so we avoid circular dependencies, which break the JSON compliancy.
       */
      const safeStringify = (obj, indent = 2) => {
        let cache = [];

        const retVal = JSON.stringify(obj, (key, value) =>
          typeof value === "object" && value !== null ? Object.getPrototypeOf(value) !== Object.prototype || cache.includes(value) ? undefined : cache.push(value) && value : value,
          indent);
        return retVal;
      };

      const data = Object.assign({}, $0.__data, $0.__data__);

      // Need to parse it back to a JSON object
      return JSON.parse(safeStringify(data));
    } else {
      // Lit element
      const tagName = $0.localName;
      const selectedElementClass = window.customElements.get(tagName);

      if (selectedElementClass) {
        const classPropertiesMap = selectedElementClass._classProperties;

        // Might still not be a Lit element
        if (!classPropertiesMap) {
          return { message: 'The selected element is neither a Lit nor a Polymer webcomponent.' };
        }
        const result = {}
        classPropertiesMap.forEach((element, key) => {
          result[key] = $0[key];
        });
        return result;
      } else {
        // Neither a Polymer nor a Lit element
        return { message: 'The selected element is neither a Lit nor a Polymer webcomponent.' };
      }
    }
  }
};

let cachedResult = {};
let rerenderData = true;
let intervalId;
let updateElementProperties;
let autoRefresh = true;

chrome.storage.sync.get('settings', (data) => {
  if (data.settings.autoRefresh === false) {
    autoRefresh = false;
  }
});

const createSidebarPaneCallback = (sidebar) => {

  // Update element properties
  updateElementProperties = () => {
    chrome.devtools.inspectedWindow.eval("(" + computeComponentProperties + ")()",
      (result, isException) => {
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
      }
    );


    if (!intervalId && autoRefresh) {
      // Update data periodically
      intervalId = setInterval(updateElementProperties, 250);
    }
  }

  panels.elements.onSelectionChanged.addListener(updateElementProperties);
};

panels && panels.elements.createSidebarPane("Lit Prism", createSidebarPaneCallback);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings?.newValue) {
    autoRefresh = Boolean(changes.settings.newValue.autoRefresh);

    if (autoRefresh === false && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else if (!intervalId) {
      intervalId = setInterval(updateElementProperties, 250);
    }
  }
});