var currentToneUp = undefined;
var currentToneDown = undefined;

var TONES_UP = [
    ['String 1', 'y', 'string1'],
    ['String 3', 'y', 'string3'],
    ['Brass 1', 'r', 'brass1'],
    ['Flute', 'w', 'flute'],
    ['Electric Piano', 'y', 'epiano'],
    ['Clavi-\nchord 1', 'y', 'clav1'],
    ['Harpsi-\nchord 1', 'y', 'harpsi1'],
    ['Organ 1', 'w', 'organ1'],
    ['Guitar 1', 'y', 'guitar1'],
    ['Funky 1', 'g', 'funky1'],
    ['Funky 3', 'g', 'funky3']
];
var TONES_DOWN = [
    ['String 2', 'y', 'string2'],
    ['String 4', 'y', 'string4'],
    ['Brass 2', 'r', 'brass2'],
    ['Brass 3', 'r', 'brass3'],
    ['Bass', 'y', 'bass'],
    ['Clavi-\nchord 2', 'y', 'clav2'],
    ['Harpsi-\nchord 2', 'y', 'harpsi2'],
    ['Organ 2', 'w', 'organ2'],
    ['Guitar 2', 'y', 'guitar2'],
    ['Funky 2', 'g', 'funky2'],
    ['Funky 4', 'g', 'funky4']
];
var BANK_INDEX = [
    ['1', 'string1', 'string2'],
    ['2', 'string3', 'string4'],
    ['3', 'brass1', 'brass2'],
    ['4', 'flute', 'brass3'],
    ['5', 'epiano', 'bass'],
    ['6', 'clav1', 'clav2'],
    ['7', 'harpsi1', 'harpsi2'],
    ['8', 'organ1', 'organ2'],
    ['9', 'guitar1', 'guitar2'],
    ['10', 'funky1', 'funky2'],
    ['11', 'funky3', 'funky4'],
    ['20', 'string1', 'brass2'],
    ['21', 'string3', 'brass2'],
    ['22', 'flute', 'brass2'],
    ['23', 'epiano', 'brass2'],
    ['24', 'clav1', 'brass2'],
    ['25', 'harpsi1', 'brass2'],
    ['26', 'organ1', 'brass2'],
    ['27', 'guitar1', 'brass2'],
    ['28', 'funky1', 'brass2'],
    ['29', 'funky3', 'brass2'],
    ['30', 'string1', 'brass3'],
    ['31', 'string3', 'brass3'],
    ['32', 'brass1', 'brass3'],
    ['33', 'epiano', 'brass3'],
    ['34', 'clav1', 'brass3'],
    ['35', 'harpsi1', 'brass3'],
    ['36', 'organ1', 'brass3'],
    ['37', 'guitar1', 'brass3'],
    ['38', 'funky1', 'brass3'],
    ['39', 'funky3', 'brass3'],
    ['40', 'string1', 'bass'],
    ['41', 'string3', 'bass'],
    ['42', 'brass1', 'bass'],
    ['43', 'flute', 'bass'],
    ['44', 'clav1', 'bass'],
    ['45', 'harpsi1', 'bass'],
    ['46', 'organ1', 'bass'],
    ['47', 'guitar1', 'bass'],
    ['48', 'funky1', 'bass'],
    ['49', 'funky3', 'bass'],
    ['50', 'string3', 'string2'],
    ['51', 'brass1', 'string2'],
    ['52', 'flute', 'string2'],
    ['53', 'epiano', 'string2'],
    ['54', 'clav1', 'string2'],
    ['55', 'harpsi1', 'string2'],
    ['56', 'organ1', 'string2'],
    ['57', 'guitar1', 'string2'],
    ['58', 'funky1', 'string2'],
    ['59', 'funky3', 'string2'],
    ['60', 'string1', 'string4'],
    ['61', 'brass1', 'string4'],
    ['62', 'flute', 'string4'],
    ['63', 'epiano', 'string4'],
    ['64', 'clav1', 'string4'],
    ['65', 'harpsi1', 'string4'],
    ['66', 'organ1', 'string4'],
    ['67', 'guitar1', 'string4'],
    ['68', 'funky1', 'string4'],
    ['69', 'funky3', 'string4'],
    ['70', 'string1', 'clav2'],
    ['71', 'string3', 'clav2'],
    ['72', 'brass1', 'clav2'],
    ['73', 'flute', 'clav2'],
    ['74', 'epiano', 'clav2'],
    ['75', 'harpsi1', 'clav2'],
    ['76', 'organ1', 'clav2'],
    ['77', 'guitar1', 'clav2'],
    ['78', 'funky1', 'clav2'],
    ['79', 'funky3', 'clav2'],
    ['80', 'string1', 'harpsi2'],
    ['81', 'string3', 'harpsi2'],
    ['82', 'brass1', 'harpsi2'],
    ['83', 'flute', 'harpsi2'],
    ['84', 'epiano', 'harpsi2'],
    ['85', 'clav1', 'harpsi2'],
    ['86', 'organ1', 'harpsi2'],
    ['87', 'guitar1', 'harpsi2'],
    ['88', 'funky1', 'harpsi2'],
    ['89', 'funky3', 'harpsi2'],
    ['90', 'string1', 'organ2'],
    ['91', 'string3', 'organ2'],
    ['92', 'brass1', 'organ2'],
    ['93', 'flute', 'organ2'],
    ['94', 'epiano', 'organ2'],
    ['95', 'clav1', 'organ2'],
    ['96', 'harpsi1', 'organ2'],
    ['97', 'guitar1', 'organ2'],
    ['98', 'funky1', 'organ2'],
    ['99', 'funky3', 'organ2'],
    ['100', 'string1', 'guitar2'],
    ['101', 'string3', 'guitar2'],
    ['102', 'brass1', 'guitar2'],
    ['103', 'flute', 'guitar2'],
    ['104', 'epiano', 'guitar2'],
    ['105', 'clav1', 'guitar2'],
    ['106', 'harpsi1', 'guitar2'],
    ['107', 'organ1', 'guitar2'],
    ['108', 'funky1', 'guitar2'],
    ['109', 'funky3', 'guitar2'],
    ['110', 'string1', 'funky2'],
    ['111', 'string3', 'funky2'],
    ['112', 'brass1', 'funky2'],
    ['113', 'flute', 'funky2'],
    ['114', 'epiano', 'funky2'],
    ['115', 'clav1', 'funky2'],
    ['116', 'harpsi1', 'funky2'],
    ['117', 'organ1', 'funky2'],
    ['118', 'guitar1', 'funky2'],
    ['119', 'funky3', 'funky2']
];


function initToneSelector(){
    currentToneUp = TONES_UP[0];
    currentToneDown = TONES_DOWN[0];
}

function getPCNumberFromTonePair(toneUp, toneDown) {
    var pcNumber = undefined;
    for (var i in BANK_INDEX) {
        if ((toneUp[2] === BANK_INDEX[i][1]) && (toneDown[2] === BANK_INDEX[i][2])) {
            pcNumber = parseInt(BANK_INDEX[i][0], 10);
        }
    }
    return pcNumber - 1;  // subtract 1 as in preset bank presets are 0-indexed
}

function getToneFromId(tones, toneID) {
    for (var i in tones) {
        if (tones[i][2] === toneID) {
            return tones[i];
        }
    }
}

function pressToneButton(toneType, toneID) {
    if (toneType === 'toneUp') {
        currentToneUp = getToneFromId(TONES_UP, toneID);
        console.log('New tone up:', currentToneUp);
    } else if (toneType === 'toneDown') {
        currentToneDown = getToneFromId(TONES_DOWN, toneID);
        console.log('New tone down:', currentToneDown);
    }
    drawToneSelector();
    setTimeout(() => {
        // Using a very short setTimeout so tone selector UI is updated immediately and UI is more responsive
        updateCurrentPreset();    
    }, 10);
}

function updateCurrentPreset(){
    var presetIdx = getPCNumberFromTonePair(currentToneUp, currentToneDown);
    PRESET_MANAGER.setCurrentPresetFromIdx(presetIdx);
    PRESET_MANAGER.currentPreset.sendMIDI();
    drawPresetControls();
}