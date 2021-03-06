/* util function to generate preset IDs */

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/* Math utils */

function roundToN(value, N){
	if (N === undefined){
		N = 2;
	}
	return Math.round(Math.pow(10, N) * value) / Math.pow(10, N);
}

function sum(array){
	return array.reduce((a, b) => a + b, 0);
}

function normalize(min, max) {
	var delta = max - min;
	return function (val) {
		return (val - min) / delta;
	};
}

function computeEuclideanDistance(p1x, p1y, p2x, p2y) {
	return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
}

function isInTriangle(px, py, ax, ay, bx, by, cx, cy) {

	//credit: http://www.blackpawn.com/texts/pointinpoly/default.html

	var v0 = [cx - ax, cy - ay];
	var v1 = [bx - ax, by - ay];
	var v2 = [px - ax, py - ay];

	var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
	var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
	var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
	var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
	var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

	var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

	var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
	var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

	return ((u >= 0) && (v >= 0) && (u + v < 1));
}

/* util functions to display control values */
// TODO: implement these range functions

function rangeDefault(value, midiValue, normValue){
	return `${value}`;
}

function range10(value, midiValue, normValue){
	return `${roundToN(10 * normValue, 1)}`;
}

function rangeSlowFast(value, midiValue, normValue){
	return range10(value, midiValue, normValue);
}

function rangePW(value, midiValue, normValue){
	return `${roundToN(100 * ((normValue * 0.4) + 0.5), 0)}%`;
}

function rangeLowHigh(value, midiValue, normValue){
	return range10(value, midiValue, normValue);
}

function rangeIL(value, midiValue, normValue){
	return `${roundToN(-5 * normValue)}`;
}

function rangeAL(value, midiValue, normValue){
	return `${roundToN(5 * normValue)}`;
}

function rangeShortLong(value, midiValue, normValue){
	return range10(value, midiValue, normValue);
}

function rangeDetune(value, midiValue, normValue){
	return `${roundToN((normValue - 0.5) * 2 * -100, 0)}%`;
}

function rangeFeet(value, midiValue, normValue){
	midiValue = 127 - midiValue;
	if (midiValue >= 0 && midiValue < 22){
		return `16'`;
	} else if (midiValue >= 22 && midiValue < 43){
		return `8'`;
	} else if (midiValue >= 43 && midiValue < 64){
		return `5 1/3'`;
	} else if (midiValue >= 64 && midiValue < 85){
		return `4'`;
	} else if (midiValue >= 85 && midiValue < 106){
		return `2 2/3'`;
	} else if (midiValue >= 106 && midiValue < 128){
		return `2'`;
	}
}

function rangeFunction(value, midiValue, normValue){
	midiValue = 127 - midiValue;
	if (midiValue >= 0 && midiValue < 22){
		return `Sin`;
	} else if (midiValue >= 22 && midiValue < 43){
		return `Tri`;
	} else if (midiValue >= 43 && midiValue < 64){
		return `Inv Tri`;
	} else if (midiValue >= 64 && midiValue < 85){
		return `Sqr`;
	} else if (midiValue >= 85 && midiValue < 106){
		return `Rnd`;
	} else if (midiValue >= 106 && midiValue < 128){
		return `Ext`;
	}
}

function rangeNone(value, midiValue, normValue){
	return range10(value, midiValue, normValue);
}

function rangeMix(value, midiValue, normValue){
	var percentageCh1 = Math.round(100*normValue);
	var percentageCh2 = 100 - Math.round(100*normValue);
	return `${percentageCh1}% I - ${percentageCh2}% II`;
}

function rangeGlideMode(value, midiValue, normValue){
	if (midiValue < 32){ // Follow DDRM MIDI spec
        return 'Portamento';
    } else if (midiValue >= 32 && midiValue < 85){
        return 'None';
    } else if (midiValue >= 85){
        return 'Glissando';
    }
}

function rangeOnOff(value, midiValue, normValue){
	if (normValue <= 0.5){
		return 'ON';
	} else {
		return 'OFF';
	}
}

function rangeSustain12(value, midiValue, normValue) {
	if (normValue <= 0.5) {
		return 'I';
	} else {
		return 'II';
	}
}
