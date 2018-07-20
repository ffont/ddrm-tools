var PRESET_MANAGER;
var ONLINE_STORE;
var LOCAL_STORE;
var MAX_BANK_PRESETS = 128;
var N_BYTES_PER_BANK = 98;
var CHANNEL1 = 'ch1';
var CHANNEL2 = 'ch2';
var CONTROLS_STRUCTURE = {
    CHANNEL1: {
        'VCO': [
            {'name': 'SPEED A', 'type': 'slider', 'midiCC': 40, 'byteNumber': 1},
            {'name': 'PWM A', 'type': 'slider', 'midiCC': 41, 'byteNumber': 2},
            {'name': 'PW A', 'type': 'slider', 'midiCC': 42, 'byteNumber': 3},
            {'name': 'NOISE A', 'type': 'slider', 'midiCC': 45, 'byteNumber': 4}
        ],
        'VCF': [
            {'name': 'HPF A', 'type': 'slider', 'midiCC': 46, 'byteNumber': 5},
            {'name': 'RESh A', 'type': 'slider', 'midiCC': 47, 'byteNumber': 6},
            {'name': 'LPF A', 'type': 'slider', 'midiCC': 48, 'byteNumber': 7},
            {'name': 'RESl A', 'type': 'slider', 'midiCC': 49, 'byteNumber': 8}
        ],
    },
    CHANNEL2: {
        'VCO': [
            {'name': 'SPEED B', 'type': 'slider', 'midiCC': 67, 'byteNumber': 25},
            {'name': 'PWM B', 'type': 'slider', 'midiCC': 68, 'byteNumber': 26},
            {'name': 'PW B', 'type': 'slider', 'midiCC': 69, 'byteNumber': 27},
            {'name': 'NOISE B', 'type': 'slider', 'midiCC': 72, 'byteNumber': 28}
        ],
        'VCF': [
            {'name': 'HPF B', 'type': 'slider', 'midiCC': 73, 'byteNumber': 29},
            {'name': 'RESh B', 'type': 'slider', 'midiCC': 119, 'byteNumber': 30},
            {'name': 'LPF B', 'type': 'slider', 'midiCC': 75, 'byteNumber': 31},
            {'name': 'RESl B', 'type': 'slider', 'midiCC': 76, 'byteNumber': 32}
        ],
    }
}