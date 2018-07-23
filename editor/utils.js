/* util functions to display control values */
// TODO: implement these range functions

function rangeDefault(value, midiValue, normValue){
	return `${value}`;
}

function range10(value, midiValue, normValue){
	return `${Math.round(10*normValue)}`;
}

function rangePW(value, midiValue, normValue){
	return value;
}

function rangeLowHigh(value, midiValue, normValue){
	return value;
}

function rangeIL(value, midiValue, normValue){
	return value;
}

function rangeAL(value, midiValue, normValue){
	return value;
}

function rangeShortLong(value, midiValue, normValue){
	return value;
}

function rangeDetune(value, midiValue, normValue){
	return value;
}

function rangeFeet(value, midiValue, normValue){
	return value;
}

function rangeFunction(value, midiValue, normValue){
	if (midiValue >= 0 && midiValue < 22){
		return `Sin`;
	} else if (midiValue >= 22 && midiValue < 43){
		return `Tri`;
	} else if (midiValue >= 43 && midiValue < 64){
		return `Inv Tri`;
	} else if (midiValue >= 64 && midiValue < 85){
		return `Sqr`;
	} else if (midiValue >= 85 && midiValue < 106){
		return `RND`;
	} else if (midiValue >= 106 && midiValue < 128){
		return `EXT`;
	}
}

function rangeNone(value, midiValue, normValue){
	return value;
}

function rangeMix(value, midiValue, normValue){
	var percentageCh1 = Math.round(100*normValue);
	var percentageCh2 = 100 - Math.round(100*normValue);
	return `${percentageCh1}% I - ${percentageCh2}% II`;
}

function rangeGlideMode(value, midiValue, normValue){
	return value;
}