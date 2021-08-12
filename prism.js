var panels = chrome && chrome.devtools && chrome.devtools.panels;
var bkg = chrome.extension.getBackgroundPage();

var getPropsForSidebar = function () {
    if ($0) {
        if ($0.__data__ || $0.__data) {
            // Polymer element
            return Object.assign({}, $0.__data__, $0.__data);
        } else {
            // Lit element
            const tagName = $0.localName;
            const selectedElementClass = window.customElements.get(tagName);

            if (selectedElementClass) {
                const classPropertiesMap = selectedElementClass._classProperties;

                const result = {}
                classPropertiesMap.forEach((element, key) => {
                    result[key] = $0[key];
                });
                return result;
            } else {
                return { error: 'Not a registered webComponent.' };
            }
        }
    }
};

var createSidebarPaneCallback = function (sidebar) {

    // Update element properties
    function updateElementProperties() {
        sidebar.setExpression("(" + getPropsForSidebar + ")()");
        // sidebar.setObject(getPropsForSidebar());        
    }

    panels.elements.onSelectionChanged.addListener(updateElementProperties);

    // Update data periodically
    // setInterval(updateElementProperties, 1000);
};

panels && panels.elements.createSidebarPane("Lit Prism", createSidebarPaneCallback);