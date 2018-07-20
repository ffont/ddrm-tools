
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
        console.log('Sent MIDI CC message with bytes: ' + message.data);   
    }
}

function getMIDIMessage(message) {
    if (message.target.id === midiInputDeviceID){  // Only process messages from selected input
        console.log('Received MIDI message with bytes: ' + message.data);
        if (PRESET_MANAGER.currentPreset){
            PRESET_MANAGER.currentPreset.receiveMIDI(message);    
        }
    }
}