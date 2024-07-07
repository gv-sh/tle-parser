// index.js

function parseTLE(tleString) {
    const tleLines = tleString.trim().split('\n');
    
    if (tleLines.length < 2) {
        throw new Error('Invalid TLE data');
    }

    const line1 = tleLines[0];
    const line2 = tleLines[1];
    
    const tleObject = {
        lineNumber1: line1.substring(0, 1).trim(),
        satelliteNumber1: line1.substring(2, 7).trim(),
        classification: line1.substring(7, 8).trim(),
        internationalDesignatorYear: line1.substring(9, 11).trim(),
        internationalDesignatorLaunchNumber: line1.substring(11, 14).trim(),
        internationalDesignatorPiece: line1.substring(14, 17).trim(),
        epochYear: line1.substring(18, 20).trim(),
        epoch: line1.substring(20, 32).trim(),
        firstDerivative: line1.substring(33, 43).trim(),
        secondDerivative: line1.substring(44, 52).trim(),
        bStar: line1.substring(53, 61).trim(),
        ephemerisType: line1.substring(62, 63).trim(),
        elementSetNumber: line1.substring(64, 68).trim(),
        checksum1: line1.substring(68, 69).trim(),
        lineNumber2: line2.substring(0, 1).trim(),
        satelliteNumber2: line2.substring(2, 7).trim(),
        inclination: line2.substring(8, 16).trim(),
        rightAscension: line2.substring(17, 25).trim(),
        eccentricity: line2.substring(26, 33).trim(),
        argumentOfPerigee: line2.substring(34, 42).trim(),
        meanAnomaly: line2.substring(43, 51).trim(),
        meanMotion: line2.substring(52, 63).trim(),
        revolutionNumber: line2.substring(63, 68).trim(),
        checksum2: line2.substring(68, 69).trim(),
    };

    return tleObject;
}

module.exports = { parseTLE };