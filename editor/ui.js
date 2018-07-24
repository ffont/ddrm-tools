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
        var htmlElements = control.draw();
        if (htmlElements !== undefined){
            controlsElement.appendChild(htmlElements);    
        }
        control.postDraw();
    }     
}
