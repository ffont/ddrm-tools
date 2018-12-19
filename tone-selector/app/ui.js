var SYNTH_UI_SCALE_FACTOR = 1.00;
var MIN_SCALE_FACTOR = 0.62;
var MAX_SCALE_FACTOR = 1.0;
var SYNTH_UI_GLOBAL_SACLE_FACTOR = 0.85;
var MAX_PRESET_SELECT_SIZE = 14;
var CLOSED_BOTTOM_PANEL_HEIGHT = 50;

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
    SYNTH_UI_SCALE_FACTOR = SYNTH_UI_SCALE_FACTOR * SYNTH_UI_GLOBAL_SACLE_FACTOR;
}

/* UI drawing */

function drawPresetManagerControls() {
    controlsElement = document.getElementById("presetManagerControls");

    if (controlsElement !== null){
        controlsElement.innerHTML = "";

        var presetsDictionary = PRESET_MANAGER.getPresetsDictionary();
        var numberOfPresets = PRESET_MANAGER.getFlatListOfPresets().length;

        var presetListSelect = document.createElement("select");
        presetListSelect.id = 'presetListSelect';
        presetListSelect.size = Math.max(Math.min(numberOfPresets, MAX_PRESET_SELECT_SIZE), 10);
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
}


function drawPresetControls(){

    var preset = PRESET_MANAGER.currentPreset;

    var controlsElement = document.getElementById("synthControls");
    controlsElement.innerHTML = "";    

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
    blockUI.innerHTML = '<div>Building space...</div>'
    document.body.appendChild(blockUI);
}

function unblockUI(){
    var blockUI = document.getElementById("uiBlocker");
    if (blockUI !== null){
        document.body.removeChild(blockUI);    
    }
}

function toggleBottomPanel() {
    var h = (window.innerHeight - document.getElementById("header").offsetHeight);
    CLOSED_BOTTOM_PANEL_HEIGHT = Math.round(h * 0.12);

    var bottomPanelToggleControls = document.getElementById("bottomPanelToggleControls");
    var bottomPanelToggleControlsAnchor = document.getElementById("bottomPanelToggleControlsAnchor");
    var bottomPanel = document.getElementById("bottomPanel");
    if (bottomPanel.offsetHeight <= CLOSED_BOTTOM_PANEL_HEIGHT){
        bottomPanelToggleControlsAnchor.innerHTML = '&darr;';
        bottomPanel.style.height = (document.getElementById('synthControls').offsetHeight + 20) + 'px';
        bottomPanel.style.transition = 'height .25s';
    } else {
        bottomPanelToggleControlsAnchor.innerHTML = '&uarr;';
        bottomPanel.style.height = CLOSED_BOTTOM_PANEL_HEIGHT + 'px';
    } 
}

/* UI */

function createTrFromTones(tones, selectedToneID, toneType, trTitle) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.appendChild(document.createTextNode(trTitle));
    td.setAttribute('class', 'row_title');
    tr.appendChild(td);
    for (var i in tones) {
        var toneName = tones[i][0];
        var toneColor = tones[i][1];
        var toneID = tones[i][2];
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(toneName))
        td.setAttribute('id', toneID);
        var klass = 'color-' + toneColor;
        if (toneID === selectedToneID) {
            klass += ' selected';
        }
        if (toneID === 'funky4') {
            klass = 'button-disabled';
        }
        td.setAttribute('class', klass);
        if (toneID !== 'funky4') {
            // Add click handler excpet for funky4 which has not been programmed
            td.setAttribute('onclick', 'pressToneButton(\'' + toneType + '\', \'' + toneID + '\')')
        } else {
            td.setAttribute('onclick', 'showMessage(\'Oups, this button seems to be broken :(\')')
        }
        tr.appendChild(td)
    }
    return tr;
}

function drawToneSelector() {
    var table = document.getElementById("buttonGrid");
    table.innerHTML = '';
    table.appendChild(createTrFromTones(TONES_UP, CURRENT_TONE_UP[2], 'toneUp', 'I'));
    table.appendChild(createTrFromTones(TONES_DOWN, CURRENT_TONE_DOWN[2], 'toneDown', 'II'));
}
