/* FileBank, Preset and Control classes */
const CONTROL_TYPE_SLIDER = 'slider';
const CONTROL_TYPE_SWITCH_OFF_ON = 'switchOffOn';
const CONTROL_TYPE_GLIDE_MODE = 'glideMode';
const N_BYTES_PER_PRESET = 98;

// UI base sizes
const CONTROL_WIDTH = 60;
const CONTROL_HEIGHT = 180;
const SLIDER_HEIGHT = 100;
const CONTROL_LABEL_HEIGHT = 25;
const CONTROL_LABEL_FONT_SIZE = 10;
const SWITCH2_HEIGHT = 25;
const SWITCH3_WIDTH = 30;
const CONTROL_MARGIN = CONTROL_WIDTH * 0.06;
const CONTROL_SLIDER_MARGIN_TOP = 15;
const SWITCH2_MARGIN_TOP = 55;
const SWITCH3_MARGIN_TOP = 57;

function Control(name, section, layoutRow, color, type, nTicks, midiCC, byteNumber, displayValueFuncName) {
    var self = this;
    this.name = name;
    this.section = section;
    this.layoutRow = layoutRow;
    this.color = color;
    this.type = type;
    this.nTicks = nTicks;
    this.valueMin = 0;
    this.valueMax = 255;
    this.value = 0;
    this.midiCC = midiCC;
    this.byteNumber = byteNumber;
    if (displayValueFuncName !== ''){
        this.displayValueFunc = window[displayValueFuncName];
    } else {
        this.displayValueFunc = rangeDefault;
    }
    this.inputElementID = `id-${name.replace(' ', '_')}-${section.replace(' ', '_')}-${midiCC}`;
    
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
        controlDiv.style['width'] = `${Math.floor(CONTROL_WIDTH * SYNTH_UI_SCALE_FACTOR)}px`;
        controlDiv.style['height'] = `${Math.floor(CONTROL_HEIGHT * SYNTH_UI_SCALE_FACTOR)}px`;
        controlDiv.style['margin'] = `${Math.floor(CONTROL_MARGIN  * SYNTH_UI_SCALE_FACTOR)}px`;

        if (self.color !== ''){
            controlDiv.className += ` ${self.color}Color`;
        }

        if (self.type === CONTROL_TYPE_SLIDER){
            var slider = document.createElement("input");
            slider.type = 'text';
            slider.id = self.inputElementID;
            slider.value = self.getValue();
            self.dataSliderID = self.inputElementID + '-Slider';
            slider.setAttribute('data-slider-id', self.dataSliderID);
            slider.setAttribute('data-slider-min', self.valueMin);
            slider.setAttribute('data-slider-max', self.valueMax);
            slider.setAttribute('data-slider-step', 1);
            slider.setAttribute('data-slider-value', self.getValue());
            slider.setAttribute('data-slider-reversed', true);
            slider.setAttribute('data-slider-orientation', 'vertical');
            if (self.nTicks === 6){
                slider.setAttribute('data-slider-ticks', '[0, 51, 102, 153, 205, 254]');
            } else if (self.nTicks === 5){
                slider.setAttribute('data-slider-ticks', '[0, 64, 127, 191, 254]');
            } else if (self.nTicks === 1){
                slider.setAttribute('data-slider-ticks', '[0, 127, 255]');
                slider.setAttribute('data-slider-ticks-snap-bounds', '3');
            }
            slider.onchange = self.oninput;
            controlDiv.append(slider);

        } else if (self.type === CONTROL_TYPE_SWITCH_OFF_ON){
            var sliderOffOn = document.createElement("input");
            sliderOffOn.type = 'text';
            sliderOffOn.id = self.inputElementID;
            sliderOffOn.value = self.getValue();
            self.dataSliderID = self.inputElementID + '-SliderOffOn';
            sliderOffOn.setAttribute('data-slider-id', self.dataSliderID);
            sliderOffOn.setAttribute('data-slider-min', self.valueMin);
            sliderOffOn.setAttribute('data-slider-max', self.valueMax);
            sliderOffOn.setAttribute('data-slider-step', 255);
            sliderOffOn.setAttribute('data-slider-handle', 'square');
            sliderOffOn.setAttribute('data-slider-value', self.getValue());
            sliderOffOn.setAttribute('data-slider-reversed', true);
            sliderOffOn.setAttribute('data-slider-orientation', 'vertical');
            sliderOffOn.onchange = self.oninput;
            controlDiv.append(sliderOffOn);

        } else if (self.type === CONTROL_TYPE_GLIDE_MODE){
            var switchGlideMode = document.createElement("input");
            switchGlideMode.type = 'text';
            switchGlideMode.id = self.inputElementID;
            switchGlideMode.value = self.getValue();
            self.dataSliderID = self.inputElementID + '-SliderOffOn';
            switchGlideMode.setAttribute('data-slider-id', self.dataSliderID);
            switchGlideMode.setAttribute('data-slider-min', self.valueMin);
            switchGlideMode.setAttribute('data-slider-max', self.valueMax);
            switchGlideMode.setAttribute('data-slider-step', 127);
            switchGlideMode.setAttribute('data-slider-handle', 'square');
            switchGlideMode.setAttribute('data-slider-value', self.getValue());
            switchGlideMode.setAttribute('data-slider-reversed', false);
            switchGlideMode.setAttribute('data-slider-orientation', 'horizontal');
            switchGlideMode.onchange = self.oninput;
            controlDiv.append(switchGlideMode);

        } else {
            // If no control type is specified, return undefined (and draw nothing)
            return undefined;
        }

        var labelDiv = document.createElement("div");
        labelDiv.className = 'labelDiv';
        var label = document.createElement("label");
        label.innerHTML = self.name + '<br>' + self.section;
        label.htmlFor = self.inputElementID;
        label.style['width'] = `${Math.floor(CONTROL_WIDTH * SYNTH_UI_SCALE_FACTOR)}px`;
        label.style['height'] = `${Math.floor(CONTROL_LABEL_HEIGHT * SYNTH_UI_SCALE_FACTOR)}px`;
        label.style['font-size'] = `${Math.floor(CONTROL_LABEL_FONT_SIZE * SYNTH_UI_SCALE_FACTOR)}px`;
        labelDiv.append(label);
        controlDiv.append(labelDiv)

        return controlDiv;
    }
    this.postDraw = function() {
        // Do things needed post-draw like setting up sliders
        if (self.type === CONTROL_TYPE_SLIDER){
            self.sliderUI = new Slider(`#${self.inputElementID}`, {
                formatter: function(value) {
                    return `${self.name}: ${self.displayValueFunc(self.getValue(), self.getMIDIValue(), self.getNormValue())}`;
                }
            });
            self.sliderUI.setValue(self.getValue());
            self.sliderUI.sliderElem.style['height'] = `${Math.floor(SLIDER_HEIGHT * SYNTH_UI_SCALE_FACTOR)}px`;
            self.sliderUI.sliderElem.style['margin-top'] = `${CONTROL_SLIDER_MARGIN_TOP}px`;

            if (self.nTicks === 1) {
                // Remove first and last tick
                // Bootstrap slider does now allow to define one tick only in the middle because ticks define the range as well.
                // To show only the one in the middle we have to remove them afterwards.
                var ticksContainer = self.sliderUI.sliderElem.getElementsByClassName('slider-tick-container')[0];
                ticksContainer.removeChild(ticksContainer.childNodes[0]);
                ticksContainer.removeChild(ticksContainer.childNodes[1]);
            }
        } else if (self.type === CONTROL_TYPE_SWITCH_OFF_ON){

            self.sliderUI = new Slider(`#${self.inputElementID}`, {
                formatter: function(value) {
                    return `${self.name}: ${self.displayValueFunc(self.getValue(), self.getMIDIValue(), self.getNormValue())}`;
                }
            });
            self.sliderUI.setValue(self.getValue());
            self.sliderUI.sliderElem.style['height'] = `${SWITCH2_HEIGHT}px`; // NOTE: don't scale here //`${Math.floor(SWITCH2_HEIGHT * SYNTH_UI_SCALE_FACTOR)}px`;
            self.sliderUI.sliderElem.style['margin-top'] = `${Math.floor(SWITCH2_MARGIN_TOP * SYNTH_UI_SCALE_FACTOR)}px`;

        } else if (self.type === CONTROL_TYPE_GLIDE_MODE){

            self.sliderUI = new Slider(`#${self.inputElementID}`, {
                formatter: function(value) {
                    return `${self.name}: ${self.displayValueFunc(self.getValue(), self.getMIDIValue(), self.getNormValue())}`;
                }
            });
            self.sliderUI.setValue(self.getValue());
            self.sliderUI.sliderElem.style['width'] = `${SWITCH3_WIDTH}px`; // NOTE: don't scale here //`${Math.floor(SWITCH2_HEIGHT * SYNTH_UI_SCALE_FACTOR)}px`;
            self.sliderUI.sliderElem.style['margin-top'] = `${Math.floor(SWITCH3_MARGIN_TOP * SYNTH_UI_SCALE_FACTOR)}px`;
            self.sliderUI.sliderElem.style['margin-right'] = `10px`;
        }
    }
    this.updateUI = function() {
        if (self.type === CONTROL_TYPE_SLIDER){
            self.sliderUI.setValue(self.getValue());

        } else if (self.type === CONTROL_TYPE_SWITCH_OFF_ON){
            var switchOffOn = document.getElementById(self.inputElementID);
            if (self.getMIDIValue() >= 65){  // Follow DDRM MIDI spec
                switchOffOn.selectedIndex = 0;  // Set to Off
            } else {
                switchOffOn.selectedIndex = 1;  // Set to On
            }

        } else if (self.type === CONTROL_TYPE_GLIDE_MODE){
            var switchGlideMode = document.getElementById(self.inputElementID);
            if (self.getMIDIValue() < 32){ // Follow DDRM MIDI spec
                switchGlideMode.selectedIndex = 0;  // Set to Portamento
            } else if (self.getMIDIValue() >= 32 && self.getMIDIValue() < 85){
                switchGlideMode.selectedIndex = 1;  // Set to None
            } else if (self.getMIDIValue() >= 85){
                switchGlideMode.selectedIndex = 2;  // Set to Glissando
            }
        }
    }
    this.oninput = function() {
        var value = document.getElementById(self.inputElementID).value;
        self.setValue(value, true); // When users move virtual sliders, send MIDI values as well
    }
    this.setValue = function(value, sendMIDI) {
        self.value = value;
        if (sendMIDI === true) { 
            self.sendMIDI(); 
        }
    }
    this.setValueFromPresetBytes = function(byteValues){
        if (self.type === CONTROL_TYPE_GLIDE_MODE){
            // This is a special case for the GLIDE MODE control which uses two byte values instead of one
            // TODO: if more special cases appear we should consider using better strategies here like implementing
            // different control behaviours using inheritance
            // Glissando mode: b72=255 & b80=0 -> portamento, b72=0 & b80=255 -> glissando, b72=0 & b80 = 0 -> none
            // This behaviour is hardcoded here...

            var portamentoOn = byteValues[72] > 127;
            var glissandoOn = byteValues[80] > 127;

            if (portamentoOn && !glissandoOn){
                self.setValue(0, false); // Portamento on
            } else if (!portamentoOn && glissandoOn){
                self.setValue(255, false);  // Glissando on
            } else {
                // If both off or both on, we consider non is active
                self.setValue(127, false); // Both off
            }
        } else {
            // That's the normal case in which each control has an assigned byte position from which to load a value
            self.setValue(byteValues[self.byteNumber], false);  // Don't send MIDI out
        }
    }
    this.writeToPresetBytesArray = function(byteValues){
        if (self.type === CONTROL_TYPE_GLIDE_MODE){
            // This is a special case for the GLIDE MODE control which uses two byte values instead of one
            // TODO: if more special cases appear we should consider using better strategies here like implementing
            // different control behaviours using inheritance
            // Glissando mode: b72=255 & b80=0 -> portamento, b72=0 & b80=255 -> glissando, b72=255 & b80=255 -> none
            // This behaviour is hardcoded here...
            if (self.getMIDIValue() < 32){ // Follow DDRM MIDI spec
                // Set to Portamento
                byteValues[72] = 255;
                byteValues[80] = 0;
            } else if (self.getMIDIValue() >= 32 && self.getMIDIValue() < 85){
                // Set to None
                byteValues[72] = 255;
                byteValues[80] = 255;
            } else if (self.getMIDIValue() >= 85){
                // Set to glissando
                byteValues[72] = 0;
                byteValues[80] = 255;
            }
        } else {
            // That's the normal case in which each control has an assigned byte position to which the value is written
            byteValues[self.byteNumber] = self.getValue();
        }
        return byteValues;
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
    this.midiCCLookup = {};
    
    this.init = function(byteValues) {
        self.controls = [];
        for (var controlDef of CONTROLS_STRUCTURE){
            var control = new Control(
                controlDef.name, 
                controlDef.section, 
                controlDef.layoutRow,
                controlDef.color,
                controlDef.type,
                controlDef.nTicks,
                controlDef.midi, 
                controlDef.byte,
                controlDef.displayValueFuncName,
            )
            if (byteValues !== undefined){
                control.setValueFromPresetBytes(byteValues);
            }
            self.controls.push(control);
            self.midiCCLookup[controlDef.midi] = control;
        }
    }
    this.getControlValuesAsArray = function () {

        // Create template with empty byte values
        var bytes = [];
        for (var i = 0; i < N_BYTES_PER_PRESET; i++) {
            bytes.push(0);
        }

        // Fill in bytes per controls
        for (var control of self.controls) {
            bytes = control.writeToPresetBytesArray(bytes);
        }
        return bytes;
    }
    this.getControlValuesAsBytes = function(){
        var bytes = self.getControlValuesAsArray();
        
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
    this.receiveControlChange = function(ccNumber, ccValue) {
        if (ccNumber !== 100){
            // DDRM sends midi ccNumber 100 for feet 1, feet 2 and glide mode controls, this is bug as it should send 102 and 103 according to spec
            var control = self.midiCCLookup[ccNumber];
            control.setValue(ccValue * 2, false);  // Scale value to  0-255 range
            control.updateUI();    
        }
    }
    this.save = function(remove, store, callback) {
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
                if (callback !== undefined){
                    callback(); // Call callback if provided
                }
            });
        });
    }
}

function FileBank(name) {
    var self = this;
    this.name = name;    
    this.maxPresets = 128;
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
            self.addPreset('Preset #' + (parseInt(i, 10) + 1).toString(), presetBytes, i);
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
        console.log(bytes)
        var bankBytes = []
        for (var i=0; i<bytes.length; i=i+N_BYTES_PER_PRESET){
            bankBytes.push(bytes.slice(i, i + N_BYTES_PER_PRESET))
        }
        PRESET_MANAGER.loadBankFromFile(bankBytes, file.name);
    }
}

function loadBankFromBytesArray(bankName, bankBytesArray){
    var bankBytes = []
    for (var i = 0; i < bankBytesArray.length; i = i + N_BYTES_PER_PRESET) {
        bankBytes.push(bankBytesArray.slice(i, i + N_BYTES_PER_PRESET))
    }
    PRESET_MANAGER.loadBankFromFile(bankBytes, bankName);
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
