
/* MIDI */

var midiAccess;
var midiOutputDeviceID = undefined;
var midiInputDeviceID = undefined;

function initMIDI(controlsElement){

    if (!navigator.requestMIDIAccess) {
        console.error('Ouch! WebMIDI is not supported in this browser. Please try with Google Chrome.')
        return
    }

    navigator.requestMIDIAccess()
        .then(onMIDISuccess, onMIDIFailure);

    function onMIDISuccess(midiAccess_) {

        midiAccess = midiAccess_;

        // Connect MIDI input devices and create controls
        var midiInputControlsDiv = document.createElement("div");
        
        var midiInputsLabel = document.createElement("label");
        midiInputsLabel.innerHTML = 'MIDI input: ';
        midiInputsLabel.htmlFor = 'midiInputsSelect';
        
        var midiInputsSelect = document.createElement("select");
        midiInputsSelect.id = 'midiInputsSelect';
        midiInputsSelect.onchange = function(){
            midiInputDeviceID = document.getElementById("midiInputsSelect").value;
        };

        for (var input of midiAccess.inputs.values()){
            var option = document.createElement("option");
            option.text = input.name;
            option.value = input.id;
            midiInputsSelect.add(option);
            if (midiInputDeviceID === undefined){
                midiInputDeviceID = input.id; // Assign first
            }
            input.onmidimessage = getMIDIMessage; // Bind onmidimessage function (we filter by devices in the function itself)
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
            midiOutputDeviceID = document.getElementById("midiOutputsSelect").value;
        };

        for (var output of midiAccess.outputs.values()){
            var option = document.createElement("option");
            option.text = output.name;
            option.value = output.id;
            midiOutputsSelect.add(option);
            if (midiOutputDeviceID === undefined){
                midiOutputDeviceID = output.id; // Assign first
            }
        }

        midiOutputControlsDiv.appendChild(midiOutputsLabel)
        midiOutputControlsDiv.appendChild(midiOutputsSelect)
        controlsElement.appendChild(midiOutputControlsDiv)        
    }

    function onMIDIFailure() {
        console.error('Could not access your MIDI devices.');
    }
}

function sendMIDIProgramChange(pcNumber){
    // http://www.onicos.com/staff/iz/formats/midi-event.html
    if (pcNumber !== undefined && midiOutputDeviceID !== undefined){
        var output = midiAccess.outputs.get(midiOutputDeviceID);
        var message = [0xC0, pcNumber];  // Channel 1 only (TODO: support other channels)
        output.send(message);   
    }
}

function sendMIDIControlChange(ccNumber, value){
    // http://www.onicos.com/staff/iz/formats/midi-event.html
    if (ccNumber !== undefined && midiOutputDeviceID !== undefined){
        var output = midiAccess.outputs.get(midiOutputDeviceID);
        var message = [0xB0, ccNumber, value];  // Channel 1 only (TODO: support other channels)
        output.send(message);
        console.log('Sent MIDI CC message to: ', ccNumber, value);   
    }
}

LAST_RECEIVED_CC_VALUES = {};
FILTER_THRESHOLD = 5;
BUFFER_LENGTH = 10;
function shouldPassMessage(cc_number, cc_value){    
    var pass;

    if (!(cc_number in LAST_RECEIVED_CC_VALUES)){
        LAST_RECEIVED_CC_VALUES[cc_number] = [];
        pass = false;  // Don't pass first time message for a cc_number is received
    } else {
        var lastReceivedValues = LAST_RECEIVED_CC_VALUES[cc_number];
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
    LAST_RECEIVED_CC_VALUES[cc_number].push(cc_value);
    if (LAST_RECEIVED_CC_VALUES[cc_number].length > BUFFER_LENGTH){
        LAST_RECEIVED_CC_VALUES[cc_number] = LAST_RECEIVED_CC_VALUES[cc_number].slice(LAST_RECEIVED_CC_VALUES[cc_number].length - BUFFER_LENGTH);
    }
    return pass;
}

function midiMessageIsControlChange(message){
    return message.data[0] === 176;
}

function getMIDIMessage(message){
    if (message.target.id === midiInputDeviceID){  // Only process messages from selected input

        var allowMessage = true;
        if (midiMessageIsControlChange(message)){
            // Apply filtering due to bug in Deckard's Dream MIDI out (sliders jitter)
            allowMessage = shouldPassMessage(message.data[1], message.data[2])
        }
        if (allowMessage){
            console.log('Received MIDI message with bytes: ' + message.data);
            if (PRESET_MANAGER.currentPreset){
                PRESET_MANAGER.currentPreset.receiveMIDI(message);    
            }
        } else {
            //console.log('Discarded message')
        }
    }
}