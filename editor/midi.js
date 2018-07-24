
/* MIDI */

var ENABLE_SYSEX = false;
var midiOutputDevice = undefined;
var midiInputDevice = undefined;
var midiChannel = undefined;


function initMIDI(controlsElement){

    WebMidi.enable(function (err) {
        if (err) {
            console.log("WebMidi could not be enabled. Please try using Google Chrome.", err);
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
            controlsElement.appendChild(midiInputControlsDiv)

            
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
        midiOutputDevice.sendControlChange(ccNumber - 1, ccValue, channel);
        console.log(`Sent MIDI CC message to ch${channel} ${ccNumber} ${ccValue}`);
    }
}

LAST_RECEIVED_CC_VALUES = {};
FILTER_THRESHOLD = 5;
BUFFER_LENGTH = 10;
function shouldPassControlChangeMessage(ccNumber, ccValue, channel){    
    var pass;
    var key = `${ccNumber}-${channel}`;

    if (!(key in LAST_RECEIVED_CC_VALUES)){
        LAST_RECEIVED_CC_VALUES[key] = [];
        pass = false;  // Don't pass first time message for a ccNumber is received
    } else {
        var lastReceivedValues = LAST_RECEIVED_CC_VALUES[key];
        var difference = Math.abs(lastReceivedValues[0] - lastReceivedValues[lastReceivedValues.length - 1]);
        if (difference >= FILTER_THRESHOLD){
            // Only if the difference with the value of previous Nth message is higher than threshold
            // Consecutive messages always have difference 0 or 1, so we have to test with Nth previous one
            // If message values were oscillating quickly this could become a problem, but because sliders
            // are only moved mechanically this filtering works ok.
            pass = true;
        } else {
            pass = false;
        }
    }
    LAST_RECEIVED_CC_VALUES[key].push(ccValue);
    if (LAST_RECEIVED_CC_VALUES[key].length > BUFFER_LENGTH){
        LAST_RECEIVED_CC_VALUES[key] = LAST_RECEIVED_CC_VALUES[key].slice(LAST_RECEIVED_CC_VALUES[key].length - BUFFER_LENGTH);
    }
    return pass;
}

function receiveControlChangeMessage(ccNumber, ccValue, channel){
   
    // Apply filtering due to bug in Deckard's Dream MIDI out (sliders jitter)
    var allowMessage = shouldPassControlChangeMessage(ccNumber, ccValue, channel)
    
    if (allowMessage){
        console.log(`Received MIDI CC message from ch${channel} ${ccNumber} ${ccValue}`);
        if (PRESET_MANAGER.currentPreset){
            PRESET_MANAGER.currentPreset.receiveControlChange(ccNumber, ccValue);    
        }
    } else {
        //console.log('Discarded message')
    }
}