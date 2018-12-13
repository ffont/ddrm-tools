
/* MIDI */

var ENABLE_SYSEX = false;
var ENABLE_MIDI_IN = false;
var midiOutputDevice = undefined;
var midiInputDevice = undefined;
var midiChannel = undefined;


function initMIDI(controlsElement){

    WebMidi.enable(function (err) {
        if (err) {
            console.log("WebMidi could not be enabled. Please try using Google Chrome.", err);
            alert("Oups, looks like WebMidi is not supported in this browser, please try with Google Chrome!");
            var midiErrorDiv = document.createElement("div");
            midiErrorDiv.innerHTML = '<p>Oups! WebMidi could not be enabled :( <br> Please try using Google Chrome.</p>';
            controlsElement.appendChild(midiErrorDiv);
        } else {
            console.log("WebMidi enabled!");

            // Connect MIDI input devices and create controls
            var midiInputControlsDiv = document.createElement("div");
            
            var midiInputsLabel = document.createElement("label");
            midiInputsLabel.innerHTML = 'MIDI input: ';
            midiInputsLabel.htmlFor = 'midiInputsSelect';
            
            var midiInputsSelect = document.createElement("select");
            midiInputsSelect.id = 'midiInputsSelect';
            midiInputsSelect.onchange = function(){
                setMIDIInputDevice(WebMidi.getInputById(document.getElementById("midiInputsSelect").value));
            };

            var option = document.createElement("option");
            option.text = 'none';
            option.value = '-1';
            midiInputsSelect.add(option);
            for (var input of WebMidi.inputs){
                var option = document.createElement("option");
                option.text = input.name;
                option.value = input.id;
                if (input.name.indexOf('Deckard') !== -1){  // If "Deckard" is in MIDI device name, assign it by default
                    option.selected = 'selected';
                    setMIDIInputDevice(input);
                }
                midiInputsSelect.add(option);
            }

            midiInputControlsDiv.appendChild(midiInputsLabel)
            midiInputControlsDiv.appendChild(midiInputsSelect)
            if (ENABLE_MIDI_IN){
                controlsElement.appendChild(midiInputControlsDiv)
            }

            // Connect MIDI output devices and create controls
            var midiOutputControlsDiv = document.createElement("div");
            
            var midiOutputsLabel = document.createElement("label");
            midiOutputsLabel.innerHTML = 'MIDI output: ';
            midiOutputsLabel.htmlFor = 'midiOutputsSelect';
            
            var midiOutputsSelect = document.createElement("select");
            midiOutputsSelect.id = 'midiOutputsSelect';
            midiOutputsSelect.onchange = function(){
                setMIDIOutputDevice(WebMidi.getOutputById(document.getElementById("midiOutputsSelect").value));
            };

            var option = document.createElement("option");
            option.text = 'none';
            option.value = '-1';
            midiOutputsSelect.add(option);
            for (var output of WebMidi.outputs){
                var option = document.createElement("option");
                option.text = output.name;
                option.value = output.id;
                if ((output.name.indexOf('Deckard') !== -1) || (midiOutputDevice === undefined)){
                    // If "Deckard" is in MIDI device name, assign it by default
                    option.selected = 'selected';
                    setMIDIOutputDevice(output);
                }
                midiOutputsSelect.add(option);
            }

            var midiChannelSelect = document.createElement("select");
            midiChannelSelect.id = 'midiChannelSelect';
            midiChannelSelect.onchange = function(){
                midiChannel = document.getElementById("midiChannelSelect").value;
            };

            var option = document.createElement("option");
            option.text = 'all';
            option.value = 'all';
            option.selected = 'selected';
            midiChannel = 'all';
            midiChannelSelect.add(option);
            for (var i=0; i<16; i++){
                var option = document.createElement("option");
                option.text = i + 1;
                option.value = i + 1;
                midiChannelSelect.add(option);
            }

            midiOutputControlsDiv.appendChild(midiOutputsLabel)
            midiOutputControlsDiv.appendChild(midiOutputsSelect)
            midiOutputControlsDiv.appendChild(midiChannelSelect)
            controlsElement.appendChild(midiOutputControlsDiv)  
        }
    }, ENABLE_SYSEX);
}

function setMIDIInputDevice(device){
    if (midiInputDevice !== undefined){
        midiInputDevice.removeListener();
    }

    if (device !== false) {
        midiInputDevice = device;
        midiInputDevice.addListener('controlchange', "all", function(e) {
            receiveControlChangeMessage(e.controller.number, e.value, e.channel);
        });
    } else {
        // If device is false, the "none" option was selected
        midiInputDevice = undefined;
    }
}

function setMIDIOutputDevice(device){
    if (device !== false){
        midiOutputDevice = device;    
    } else {
        midiOutputDevice = undefined;
    }
}

function sendMIDIProgramChange(pcNumber, channel){
    if (channel === undefined) { channel = midiChannel };
    if (midiOutputDevice !== undefined){
        midiOutputDevice.sendProgramChange(pcNumber, channel);
        console.log(`Sent MIDI PC message to ch${channel} ${pcNumber}`);    
    }
}

function sendMIDIControlChange(ccNumber, ccValue, channel){
    if (channel === undefined) { channel = midiChannel };
    if (midiOutputDevice !== undefined){
        
        midiOutputDevice.sendControlChange(ccNumber, ccValue, channel);
        // console.log(`Sent MIDI CC message to ch${channel} ${ccNumber} ${ccValue}`);    
        // NOTE: DDRM uses CC 120 for glide mode. CC 120 is reserved for NRPs
        // webmidi.js forbids its use in sendControlChange so we had to hack it to allow 120 in ccNumber (replace 119 by 220 in range checks)
    }
}

function receiveControlChangeMessage(ccNumber, ccValue, channel){
    if (ENABLE_MIDI_IN){
        console.log(`Received MIDI CC message from ch${channel} ${ccNumber} ${ccValue}`);
        if (PRESET_MANAGER.currentPreset){
            PRESET_MANAGER.currentPreset.receiveControlChange(ccNumber, ccValue);    
        }
    }
}