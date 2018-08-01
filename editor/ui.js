var SYNTH_UI_SCALE_FACTOR = 1.00;
var MIN_SCALE_FACTOR = 0.62;
var MAX_SCALE_FACTOR = 1.0;

function autoAdjustUIScaleFactor(){
    var maxControlsInRow = 0;
    for (var controlDef of CONTROLS_STRUCTURE){
        if (controlDef.layoutRow === 1){
            maxControlsInRow += 1;
        }
    }
    var maxWidth = document.getElementById('synthControls').offsetWidth;
    var newMaxControlWidth = maxWidth/maxControlsInRow;  // Max control width (includes margin)
    var newScaleFactor = newMaxControlWidth/(CONTROL_WIDTH + 2 * CONTROL_MARGIN);
    if (newScaleFactor < MIN_SCALE_FACTOR){
        SYNTH_UI_SCALE_FACTOR = MIN_SCALE_FACTOR;
    } else if (newScaleFactor > MAX_SCALE_FACTOR){
        SYNTH_UI_SCALE_FACTOR = MAX_SCALE_FACTOR;
    } else {
        SYNTH_UI_SCALE_FACTOR = newScaleFactor;
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
        if (document.getElementById('idSendToSynthOnSelect').checked){
            // If "send to synth on preset select is checked, send MIDI"
            PRESET_MANAGER.currentPreset.sendMIDI();
        }
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
        if (document.getElementById('idSendToSynthOnSelect').checked){
            // If "send to synth on preset select is checked, send MIDI"
            PRESET_MANAGER.currentPreset.sendMIDI();
        }
    }

    var prevButton = document.createElement("button");
    prevButton.innerHTML = '<<';
    prevButton.onclick = function(){
        presetListSelect.selectedIndex -= 1;
        PRESET_MANAGER.setCurrentPresetFromID(presetListSelect.value);
        drawPresetControls();
        if (document.getElementById('idSendToSynthOnSelect').checked){
            // If "send to synth on preset select is checked, send MIDI"
            PRESET_MANAGER.currentPreset.sendMIDI();
        }
    }

    var sendToSynthOnSelectDiv = document.createElement("div");
    sendToSynthOnSelectDiv.className = 'checkbox';
    sendToSynthOnSelectDiv.innerHTML = '<label><input id="idSendToSynthOnSelect" type="checkbox" value="" checked="checked">Send to synth on preset change</label>';

    controlsElement.appendChild(selectLabel);
    controlsElement.appendChild(document.createElement("br"));
    controlsElement.appendChild(presetListSelect);
    controlsElement.appendChild(document.createElement("br"));
    controlsElement.appendChild(prevButton);
    controlsElement.appendChild(nextButton);
    
    controlsElement.appendChild(sendToSynthOnSelectDiv);   
}


function drawPresetControls(){

    var preset = PRESET_MANAGER.currentPreset;

    var controlsElement = document.getElementById("synthControls");
    var presetTitleDiv = document.getElementById("presetTitle");
    var presetMetadataDiv = document.getElementById("presetMetadata");
    var controlsPanelActions = document.getElementById("controlsPanelActions");
    controlsElement.innerHTML = "";
    presetTitleDiv.innerHTML = "";
    presetMetadataDiv.innerHTML = "";
    controlsPanelActions.innerHTML = "";

    // Set preset name and metadata
    if (preset === undefined){
        presetTitleDiv.innerHTML = 'No preset selected';
        return;
    }
    presetTitleDiv.innerHTML = `${preset.name}`;
    if (preset.author){
        presetMetadataDiv.innerHTML += `by ${preset.author}, `;
    }
    if (preset.timestamp){
        presetMetadataDiv.innerHTML += `${preset.timestamp.toString().split(' GMT')[0]} `;
    }
    presetMetadataDiv.innerHTML += `(${preset.id})`;


    // Add action buttons to actions section
    var sendMIDIButton = document.createElement("button");
    sendMIDIButton.innerHTML = 'Send to Synth';
    sendMIDIButton.onclick = function(){
        PRESET_MANAGER.currentPreset.sendMIDI();
    };
    var saveOnlineButton = document.createElement("button");
    saveOnlineButton.innerHTML = 'Save online';
    saveOnlineButton.onclick = function(){
        blockUI();
        PRESET_MANAGER.currentPreset.save(false, ONLINE_STORE, function(){
            unblockUI();
        });
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
    controlsPanelActions.appendChild(sendMIDIButton);
    controlsPanelActions.appendChild(saveOnlineButton);
    controlsPanelActions.appendChild(deleteOnlineButton);
    controlsPanelActions.appendChild(saveLocalButton);
    controlsPanelActions.appendChild(deleteLocalButton);
    

    // Add main synth controls
    mainControlsWrapper = document.createElement("div");
    mainControlsWrapper.id = 'mainControlsWrapper';
    channel1Controls = document.createElement("div");
    channel1Controls.id = 'channel1Controls';
    channel1Controls.className = 'controlsRow';
    channel2Controls = document.createElement("div");
    channel2Controls.id = 'channel2Controls';
    channel2Controls.className = 'controlsRow';
    noChannelControls = document.createElement("div");
    noChannelControls.id = 'noChannelControls';
    noChannelControls.className = 'controlsRow';
    for (var control of preset.controls){
        var controlHtmlElements = control.draw();
        if (controlHtmlElements !== undefined){
            if (control.layoutRow === 1){
                channel1Controls.appendChild(controlHtmlElements);
            } else if (control.layoutRow === 2){
                channel2Controls.appendChild(controlHtmlElements);
            } else if (control.layoutRow === 3){
                noChannelControls.appendChild(controlHtmlElements);
            }
        }
    }
    mainControlsWrapper.appendChild(channel1Controls);
    mainControlsWrapper.appendChild(channel2Controls);
    mainControlsWrapper.appendChild(noChannelControls);
    controlsElement.appendChild(mainControlsWrapper);
    for (var control of preset.controls){
        // Do the postDraw() after controls have been added to DOM
        control.postDraw();
    }
}

function blockUI(){
    var blockUI = document.createElement("div");
    blockUI.id = "uiBlocker";
    blockUI.innerHTML = '<div>Saving...<img src="http://www.socialups.com/static/images/fbinventory/ajax_loader.gif"></div>'
    document.body.appendChild(blockUI);
}

function unblockUI(){
    var blockUI = document.getElementById("uiBlocker");
    if (blockUI !== null){
        document.body.removeChild(blockUI);    
    }
}
