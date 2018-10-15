/* DATA STORE */

function GoogleSpreadsheetStore(scriptURL, spreadsheetURL) {
    /* 
    Uses Google Spreadsheet as backend with a script to handle writing to document
    See: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/ 

    To read data from the spreadsheet with a public URL uses Tabletop JS library.
    See: https://github.com/jsoma/tabletop
    */

    var self = this;
    this.name = 'online';
    this.scriptURL = scriptURL;
    this.spreadsheetURL = spreadsheetURL;

    this.savePreset = function(data, callback){
        console.log('Saving data to Google Spreadsheet store...');

        // Create a form element and add all keys of "data" object and their values
        var form = document.createElement("form");
        for (var key of Object.keys(data)){
            var inputElement = document.createElement("input");
            inputElement.name = key;
            inputElement.value = data[key];
            form.appendChild(inputElement);
        }

        // Add timestamp
        var timestampInput = document.createElement("input");
        timestampInput.name = 'timestamp';
        timestampInput.value = Date.now();
        form.appendChild(timestampInput);
        
        // Make POST request with serialized version of the form
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", self.scriptURL, true);
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log(`Successfully saved ${this.responseText}!`);

                // Call callback (if passed)
                if (callback !== undefined) { callback(); }
            }
        };
        xhttp.send(new FormData(form)); 

    }

    this.loadPresets = function(callback){
        console.log('Loading data from online store...');

        Tabletop.init({ 
            key: self.spreadsheetURL,
            simpleSheet: true,
            callback: function(data) {
                var filteredData = filterStoredPresets(data);
                
                console.log(`Retreived data for ${filteredData.length} presets from online store`);
                if (callback !== undefined) { callback(filteredData); }
            }
        });
    }
}


function LocalStore() {
    /* Uses browser's local storage to store presets */

    var self = this;
    this.name = 'local';
    this.SOTRAGE_PRESETS_KEY = 'loaclPresets';

    this.getLocalStoreKey = function(key, initValue){
        if (initValue === undefined){
            initValue = [];
        }
        if (localStorage.getItem(key) === null){
            localStorage.setItem(key, JSON.stringify(initValue));
        } 
        return JSON.parse(localStorage.getItem(key));
    }
    this.setLocalStoreKey = function (key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    this.savePreset = function(data, callback){
        console.log('Saving data to local store...');

        var localStorageContents = self.getLocalStoreKey(self.SOTRAGE_PRESETS_KEY);
        data['timestamp'] = Date.now(); // Add timestamp to data
        localStorageContents.push(data);
        self.setLocalStoreKey(self.SOTRAGE_PRESETS_KEY, localStorageContents);

        console.log(`Successfully saved data to local storage`);

        // Call callback (if passed)
        if (callback !== undefined) { callback(); }
    }

    this.loadPresets = function(callback){
        console.log('Loading data from local store...');

        var localStorageContents = self.getLocalStoreKey(self.SOTRAGE_PRESETS_KEY);
        var filteredData = filterStoredPresets(localStorageContents);

        console.log(`Retreived data for ${filteredData.length} presets from local store`);
        if (callback !== undefined) { callback(filteredData); }
    }
}


function filterStoredPresets(presetList){
    /*
    Take a raw list of presets as stored in an online or local store and filter the contents
    to return the relevant ones. This includes:
        - When presets exist with duplicate ID, only return the last one
        - Don't include presets marked as "DELETED"
        - Sort the resulting list of presets by alphabetical order
    */

    var filteredData = [];

    // Only add last instance of a preset with same ID
    var alreadyAddedKeys = [];
    for (var element of presetList.reverse()){  // Here he assume presets are sorted by timestamp
        var key = `${element.id}`;
        if (alreadyAddedKeys.indexOf(key) === -1){
            filteredData.push(element);
            alreadyAddedKeys.push(key);
        }
    }

    // Remove presets which have been deleted
    filteredData = filteredData.filter(element => (element.deleted !== 'TRUE' && element.deleted !== true));

    // Sort by preset name (alphabetical)
    // From: https://stackoverflow.com/questions/6712034/sort-array-by-firstname-alphabetically-in-javascript
    filteredData = filteredData.sort(function(a, b) {
        if(a.name < b.name) return -1;
        if(a.name > b.name) return 1;
        return 0;
    });

    return filteredData;
}
