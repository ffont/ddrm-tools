/* FileBank, Preset and Control classes */

function Control(name, section, type, midiCC, byteNumber) {
    var self = this;
    this.name = name;
    this.section = section;
    this.type = type;
    this.valueMin = 0;
    this.valueMax = 255;
    this.value = 0;
    this.midiCC = midiCC;
    this.byteNumber = byteNumber;
    this.inputElementID = 'id-' + name.replace(' ', '_') + '-' + section.replace(' ', '_');
    
    this.getValue = function() {
        /* Get int value in original range (0-255) */
        var value = parseInt(self.value, 10);
        if ( isNaN(value)){ value = 0; }
        if (value < self.valueMin){
            return self.valueMin;
        } else if (value > self.valueMax){
            return self.valueMax;
        } else {
            return value;
        }
    }
    this.getNormValue = function() {
        /* Get normalized float value in [0.0, 1.0] range */
        return (self.getValue() -  self.valueMin) / (self.valueMax -  self.valueMin);
    }
    this.getMIDIValue = function() {
        /* Return value in standard MIDI range [0, 127] */
        return Math.round(self.getNormValue() * 127); // 127 is MIDI maximum value
    }
    this.draw = function() {
        var controlDiv = document.createElement("div");
        controlDiv.className = 'control';

        if (type === 'slider'){
            var slider = document.createElement("input");
            slider.type = 'range';
            slider.min = "0";
            slider.max = "255";
            slider.value = self.getValue();
            slider.id = self.inputElementID;
            slider.oninput = self.oninput;

            var label = document.createElement("label");
            label.innerHTML = self.name + ' - ' + self.section;
            label.htmlFor = self.inputElementID;
            controlDiv.append(slider)
            controlDiv.append(label)
        }

        return controlDiv;
    }
    this.oninput = function() {
        var value = document.getElementById(self.inputElementID).value;
        self.setValue(value, true); // When users move sliders, send MIDI values as well
    }
    this.setValue = function(value, sendMIDI) {
        self.value = value;
        if (sendMIDI === true) { 
            self.sendMIDI(); 
        }
    }
    this.sendMIDI = function() {
        if (self.midiCC) {
            sendMIDIControlChange(self.midiCC, self.getMIDIValue());
        }
    }
}

function Preset(name, author, categories, timestamp, id) {
    var self = this;
    if (id === undefined){
        // If no ID is provided, generate one
        this.id = guid();    
    } else {
        this.id = id;
    }
    this.name = name;
    this.author = author;
    this.categories = categories;
    this.timestamp = timestamp;
    this.storeName;  // Here we will save provenance of preset (from which store it was loaded)
    this.controls = [];
    
    this.init = function(byteValues) {
        self.controls = [];
        for (var mainSectionKey of Object.keys(CONTROLS_STRUCTURE)){
            var mainSection = CONTROLS_STRUCTURE[mainSectionKey];
            for (var sectionKey of Object.keys(mainSection)){
                var section = mainSection[sectionKey];
                for (var i in section){
                    var controlDef = section[i];
                    var control = new Control(controlDef.name, sectionKey, controlDef.type, controlDef.midiCC, controlDef.byteNumber)
                    if (byteValues !== undefined){
                        control.setValue(byteValues[control.byteNumber], false); // Load value but don't send MIDI
                    }
                    self.controls.push(control);
                }
            }
        }
    }
    this.getControlValuesAsBytes = function(){
        
        // Create template with empty byte values
        var bytes = [];
        for (var i=0; i<N_BYTES_PER_BANK; i++){
            bytes.push(0);
        }

        // Fill in bytes per controls
        // TODO: deal with controls that use more than one byte?
        for (var control of self.controls){
            if (control.byteNumber){
                bytes[control.byteNumber] = control.getValue(); 
            }   
        }

        // Render array as HEX byte string
        var hexStringBytes = '';
        for (var value of bytes){
            hexStringBytes += value.toString(16).padStart(2,'0');
        }
        return hexStringBytes;
    }
    this.sendMIDI = function() {
        // Send MIDI values of all individual controls
        for (var control of self.controls){
            control.sendMIDI();
        } 
    }
    this.receiveMIDI = function(message) {
        console.log(`Preset received MIDI message: ${message}`);
        // TODO: implement that function, find to which value it corresponds and set it (without sending MIDI to avoid possible feedback loop)
    }
    this.save = function(remove, store) {
        var data = {};
        var toDelete = remove === true;

        if (self.storeName === store.name){
            data.id = self.id;
        } else {
            // This is preset being save in a store different than the store where it "comes from".
            // We generate a new ID to differentiate it from the original preset.
            // TODO: generate also new IDs in other conditions like "author has changed"
            // Maybe add a self.needsNewID() function that can be called when saving.
            data.id = guid();
        }

        if (!toDelete){
            data.name = prompt("Please enter a name for the preset:", self.name);
            if ((data.name === undefined) || (data.name === null)){
                data.name = 'noname';
            }
            if (data.name !== self.name){
                // If name is different, create new ID as well as this is "save as"
                data.id = guid();
            }    
        } else {
            data.name = self.name;
        }
        
        data.deleted = toDelete;
        data.author = self.author;
        data.categories = self.categories;
        data.data = self.getControlValuesAsBytes();

        store.savePreset(data, function(){
            // After saving, re-load local/online presets and set saved preset as selected (if not deleted)
            var func;
            if (store.name === 'local'){
                func = PRESET_MANAGER.loadLocalPresets;
            } else if (store.name === 'online'){
                func = PRESET_MANAGER.loadOnlinePresets;
            }

            func(function(){
                if (!toDelete){
                    PRESET_MANAGER.setCurrentPresetFromID(data.id);    
                } else {
                    PRESET_MANAGER.setCurrentPresetToFirstPreset();
                }
                drawPresetControls();
                drawPresetManagerControls();
            });
        });
    }
}


function FileBank(name) {
    var self = this;
    this.name = name;    
    this.maxPresets = MAX_BANK_PRESETS;
    this.presets = [];
    for (var i=0; i<this.maxPresets; i++){
        this.presets.push(undefined);
    }

    this.loadPresetsFromBankBytes = function(bankBytes, bankFileName) {
        if (bankFileName !== undefined){
            self.name = bankFileName;    
        }
        for (var i in bankBytes){
            var presetBytes = bankBytes[i];
            self.addPreset('Preset #' + i.toString(), presetBytes, i);
        }
        console.log(self.presets.length + ' presets loaded from bank ' + self.name);
    }
    this.addPreset = function(name, byteValues, position) {
        var preset = new Preset(name);
        preset.init(byteValues);
        if (position !== undefined){
            position = parseInt(position, 10);
            if ((position < 0) || (position >= self.maxPresets)){
                console.error("Can't add preset in position because position is out of range");
                return;
            } 
            self.presets[position] = preset;    
        } else {
            if (self.presets.length >= self.maxPresets){
                console.error("Can't add preset because maximum number of presets has been reached");
                return;
            } 
            self.presets.push(preset);    
        }
    }
    this.getPreset = function(position) {
        position = parseInt(position, 10);
        if ((position < 0) || (position >= self.maxPresets)){
            console.error("Can't return preset in position because position is out of range");
            return;
        }
        if (self.presets[position] !== undefined){
            return self.presets[position];
        } else {
            return new Preset();
        }
    }
}

/* Preset Manager */

function PresetManager() {
    var self = this;
    this.onlinePresets = [];
    this.localPresets = [];
    this.fileBanks = [];
    this.currentPreset;
    this.currentBank;

    this.loadLocalAndOnlinePresets = function(callback){
        self.loadLocalPresets(callback);
        self.loadOnlinePresets(callback);
    }

    this.loadOnlinePresets = function(callback){
        self.loadPresetsFromStore(ONLINE_STORE, 'onlinePresets', callback);
    }

    this.loadLocalPresets = function(callback){
        self.loadPresetsFromStore(LOCAL_STORE, 'localPresets', callback);
    }

    this.loadPresetsFromStore = function(store, saveToListVarName, callback){
        self[saveToListVarName] = [];
        store.loadPresets(function(data){
            for (var presetData of data){
                var preset = new Preset(
                    presetData.name,
                    presetData.author,
                    presetData.categories,
                    new Date(parseInt(presetData.timestamp, 10)),
                    presetData.id,
                ); 
                preset.storeName = store.name; // Save provenance info 
                var presetBytesHex = presetData.data.match(/.{1,2}/g);
                var presetBytes = presetBytesHex.map(function(num){return parseInt(num, 16)});
                preset.init(presetBytes);
                self[saveToListVarName].push(preset);
            }
            console.log(`${self[saveToListVarName].length} presets loaded from ${store.name} store`);
            drawPresetManagerControls();
            if (callback !== undefined){
                callback();
            }
        });
    }

    this.loadBankFromFile = function(bankBytes, bankName){
        var bank = new FileBank();
        bank.loadPresetsFromBankBytes(bankBytes, bankName);
        self.fileBanks.push(bank);
        drawPresetManagerControls();
    }

    this.getFlatListOfPresets = function(){
        // Return a flat list with all loaded presets from all banks/online

        var presetList = [];

        for (var preset of self.localPresets){  // Collect local presets
            presetList.push(preset);
        } 

        for (var preset of self.onlinePresets){  // Collect online presets
            presetList.push(preset);
        } 

        for (var bank of self.fileBanks){  // Collect bank file presets
            for (var preset of bank.presets){
                presetList.push(preset);
            }
        }

        return presetList;
    }

    this.getPresetsDictionary = function(){
        // Returns a dictionary with the different loaded bank names as
        // keys and a list of corresponding presets for each key.
        // Online presets are represented as one key in the dict.
        
        var presetDictionary = {};

        if (self.localPresets.length){  // Collect local presets
            presetDictionary['Local presets'] = self.localPresets;
        }

        if (self.onlinePresets.length){  // Collect online presets
            presetDictionary['Online presets'] = self.onlinePresets;
        }
        
        for (var bank of self.fileBanks){  // Collect bank file presets
            presetDictionary[bank.name] = bank.presets;
        }
        
        return presetDictionary;
    }

    this.setCurrentPresetFromID = function(presetID){
        var allPresets = self.getFlatListOfPresets();
        for (var preset of allPresets){
            if (preset.id == presetID){
                self.currentPreset = preset;
                return;
            }
        }
        console.error(`Could not load preset with ID ${presetID}`);
    }

    this.setCurrentPresetToFirstPreset = function(){
        var allPresets = self.getFlatListOfPresets();
        if (allPresets.length > 0){
            self.currentPreset = allPresets[0];
        } else {
            self.currentPreset = undefined;
        }
    }

}

/* UI drawing */

function drawPresetManagerControls() {
    controlsElement = document.getElementById("presetManagerControls");
    controlsElement.innerHTML = "";

    var presetsDictionary = PRESET_MANAGER.getPresetsDictionary();
    var numberOfPresets = PRESET_MANAGER.getFlatListOfPresets().length;

    var presetListSelect = document.createElement("select");
    presetListSelect.id = 'presetListSelect';
    presetListSelect.size = Math.max(Math.min(numberOfPresets, 20), 10);
    for (var bankName of Object.keys(presetsDictionary)){
        var optgroup = document.createElement("optgroup");
        optgroup.label = bankName;
        for (var i in presetsDictionary[bankName]){
            var preset = presetsDictionary[bankName][i];
            var option = document.createElement("option");
            option.innerHTML = `${preset.name} by ${preset.author}`;
            option.value = preset.id;
            if (PRESET_MANAGER.currentPreset !== undefined){
                // If there is current preset, mark as selected the corresponding one
                if (preset.id === PRESET_MANAGER.currentPreset.id){
                    option.selected = 'selected';
                }    
            }
            optgroup.appendChild(option);
        }
        presetListSelect.appendChild(optgroup);
    }
    presetListSelect.onchange = function(){
        PRESET_MANAGER.setCurrentPresetFromID(presetListSelect.value);
        drawPresetControls();
    };

    var selectLabel = document.createElement("label");
    selectLabel.innerHTML = 'Preset selector';
    selectLabel.htmlFor = 'presetListSelect';

    var nextButton = document.createElement("button");
    nextButton.innerHTML = '>>';
    nextButton.onclick = function(){
        presetListSelect.selectedIndex += 1;
        PRESET_MANAGER.setCurrentPresetFromID(presetListSelect.value);  
        drawPresetControls();      
    }

    var prevButton = document.createElement("button");
    prevButton.innerHTML = '<<';
    prevButton.onclick = function(){
        presetListSelect.selectedIndex -= 1;
        PRESET_MANAGER.setCurrentPresetFromID(presetListSelect.value);
        drawPresetControls();
    }

    controlsElement.appendChild(selectLabel);
    controlsElement.appendChild(document.createElement("br"));
    controlsElement.appendChild(presetListSelect);
    controlsElement.appendChild(document.createElement("br"));
    controlsElement.appendChild(prevButton);
    controlsElement.appendChild(nextButton);
}


function drawPresetControls(){
    controlsElement = document.getElementById("synthControls");
    controlsElement.innerHTML = "";
    
    var preset = PRESET_MANAGER.currentPreset;
    if (preset === undefined){
        var message = document.createElement("p");
        message.innerHTML = 'No preset selected';
        controlsElement.appendChild(message);
        return;
    }

    var presetNameDiv = document.createElement("div");
    presetNameDiv.innerHTML = `<h2>${preset.name}</h2>`;
    if (preset.author){
        presetNameDiv.innerHTML += `by ${preset.author}, `;
    }
    if (preset.timestamp){
        presetNameDiv.innerHTML += `${preset.timestamp.toString().split(' GMT')[0]} `;
    }
    presetNameDiv.innerHTML += `(${preset.id})`;

    var sendMIDIButton = document.createElement("button");
    sendMIDIButton.innerHTML = 'Send to Synth';
    sendMIDIButton.onclick = function(){
        PRESET_MANAGER.currentPreset.sendMIDI();
    };

    var saveOnlineButton = document.createElement("button");
    saveOnlineButton.innerHTML = 'Save online';
    saveOnlineButton.onclick = function(){
        PRESET_MANAGER.currentPreset.save(false, ONLINE_STORE);
    };

    var deleteOnlineButton = document.createElement("button");
    deleteOnlineButton.innerHTML = 'Delete online';
    deleteOnlineButton.onclick = function(){
        PRESET_MANAGER.currentPreset.save(true, ONLINE_STORE);
    };
    if (preset.storeName !== ONLINE_STORE.name){
        deleteOnlineButton.disabled = true;
    }

    var saveLocalButton = document.createElement("button");
    saveLocalButton.innerHTML = 'Save local';
    saveLocalButton.onclick = function(){
        PRESET_MANAGER.currentPreset.save(false, LOCAL_STORE);
    };

    var deleteLocalButton = document.createElement("button");
    deleteLocalButton.innerHTML = 'Delete local';
    deleteLocalButton.onclick = function(){
        PRESET_MANAGER.currentPreset.save(true, LOCAL_STORE);
    };
    if (preset.storeName !== LOCAL_STORE.name){
        deleteLocalButton.disabled = true;
    }

    presetNameDiv.appendChild(document.createElement("br"));
    presetNameDiv.appendChild(sendMIDIButton);
    presetNameDiv.appendChild(saveOnlineButton);
    presetNameDiv.appendChild(deleteOnlineButton);
    presetNameDiv.appendChild(saveLocalButton);
    presetNameDiv.appendChild(deleteLocalButton);

    controlsElement.appendChild(presetNameDiv);
    controlsElement.appendChild(document.createElement("br"));
    for (var control of preset.controls){
        controlsElement.appendChild(control.draw());
    }        
}

/* Reading bank files */

function loadBankFile() {
    var input, file, fr;

    if (typeof window.FileReader !== 'function') {
        console.error("The file API isn't supported on this browser yet.");
        return;
    }

    input = document.getElementById('fileinput');
    if (!input.files) {
        console.error("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
        console.log("Please select a file before clicking 'Load'");
    }
    else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedBinary;
        fr.readAsBinaryString(file);
    }

    function receivedBinary() {
        var bytes = [];
        var result = fr.result;
        result = fr.result;
        for (n = 0; n < result.length; ++n) {
            aByte = result.charCodeAt(n); // Byte in number format
            byteStr = aByte.toString(16);  // Byte in hex string format
            if (byteStr.length < 2) { byteStr = "0" + byteStr; }
            bytes.push(aByte);  // Loading number format
        }
        var bankBytes = []
        for (var i=0; i<bytes.length; i=i+N_BYTES_PER_BANK){
            bankBytes.push(bytes.slice(i, i+N_BYTES_PER_BANK))
        }
        PRESET_MANAGER.loadBankFromFile(bankBytes, file.name);
    }
}

/* utils */

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}