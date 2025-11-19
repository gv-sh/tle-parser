"use strict";
/**
 * TLE Format Conversion Module
 * Provides conversion between TLE and various orbital data formats including
 * OMM, STK, KVN, CCSDS OEM, GPS almanac, state vectors, and Keplerian elements.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanetariumFormat = exports.CoordinateFrame = void 0;
exports.tleToOMM = tleToOMM;
exports.ommToTLE = ommToTLE;
exports.ommToXML = ommToXML;
exports.tleToSTK = tleToSTK;
exports.stkToFile = stkToFile;
exports.tleToKVN = tleToKVN;
exports.kvnToText = kvnToText;
exports.tleToOEM = tleToOEM;
exports.oemToText = oemToText;
exports.extractKeplerianElements = extractKeplerianElements;
exports.tleToStateVector = tleToStateVector;
exports.keplerianToCartesian = keplerianToCartesian;
exports.tleToGPSAlmanac = tleToGPSAlmanac;
exports.transformCoordinateFrame = transformCoordinateFrame;
exports.tleToStellarium = tleToStellarium;
exports.tleToCelestia = tleToCelestia;
exports.tleToPlanetarium = tleToPlanetarium;
exports.tleToCustomFormat = tleToCustomFormat;
exports.createCustomFormat = createCustomFormat;
exports.tleToLegacyFormat = tleToLegacyFormat;
exports.reconstructTLE = reconstructTLE;
/**
 * Coordinate frame types
 */
var CoordinateFrame;
(function (CoordinateFrame) {
    CoordinateFrame["TEME"] = "TEME";
    CoordinateFrame["J2000"] = "J2000";
    CoordinateFrame["ITRF"] = "ITRF";
    CoordinateFrame["GCRF"] = "GCRF";
    CoordinateFrame["EME2000"] = "EME2000"; // Earth Mean Equator 2000
})(CoordinateFrame || (exports.CoordinateFrame = CoordinateFrame = {}));
/**
 * Planetarium software formats
 */
var PlanetariumFormat;
(function (PlanetariumFormat) {
    PlanetariumFormat["STELLARIUM"] = "STELLARIUM";
    PlanetariumFormat["CELESTIA"] = "CELESTIA";
    PlanetariumFormat["SPACENGINE"] = "SPACENGINE";
    PlanetariumFormat["UNIVERSESANDBOX"] = "UNIVERSESANDBOX";
})(PlanetariumFormat || (exports.PlanetariumFormat = PlanetariumFormat = {}));
// ============================================================================
// OMM (ORBIT MEAN ELEMENTS MESSAGE) CONVERSION
// ============================================================================
/**
 * Convert TLE to OMM format (CCSDS standard)
 */
function tleToOMM(tle, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        CCSDS_OMM_VERS: '2.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        CENTER_NAME: 'EARTH',
        REF_FRAME: 'TEME',
        TIME_SYSTEM: 'UTC',
        MEAN_ELEMENT_THEORY: 'SGP4',
        EPOCH: epoch.toISOString(),
        MEAN_MOTION: parseFloat(tle.meanMotion),
        ECCENTRICITY: parseFloat(tle.eccentricity),
        INCLINATION: parseFloat(tle.inclination),
        RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
        ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
        MEAN_ANOMALY: parseFloat(tle.meanAnomaly),
        EPHEMERIS_TYPE: parseInt(tle.ephemerisType),
        CLASSIFICATION_TYPE: tle.classification,
        NORAD_CAT_ID: tle.satelliteNumber1,
        ELEMENT_SET_NO: parseInt(tle.elementSetNumber),
        REV_AT_EPOCH: parseInt(tle.revolutionNumber),
        BSTAR: parseFloat(tle.bStar),
        MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
        MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
    };
}
/**
 * Convert OMM to TLE format
 */
function ommToTLE(omm) {
    const epoch = new Date(omm.EPOCH);
    const year = epoch.getUTCFullYear() % 100;
    const dayOfYear = getDayOfYear(epoch);
    // Line 0 (satellite name)
    let tle = `${omm.OBJECT_NAME}\n`;
    // Line 1
    const line1Parts = [
        '1',
        omm.NORAD_CAT_ID.padStart(5, ' '),
        omm.CLASSIFICATION_TYPE,
        ' ',
        formatInternationalDesignator(omm.OBJECT_ID),
        ' ',
        year.toString().padStart(2, '0'),
        dayOfYear.toFixed(8).padStart(12, ' '),
        ' ',
        formatScientific(omm.MEAN_MOTION_DOT, 8),
        ' ',
        formatScientific(omm.MEAN_MOTION_DDOT, 8),
        ' ',
        formatScientific(omm.BSTAR, 8),
        ' ',
        omm.EPHEMERIS_TYPE.toString(),
        ' ',
        omm.ELEMENT_SET_NO.toString().padStart(4, ' ')
    ];
    const line1 = line1Parts.join('');
    const checksum1 = calculateChecksum(line1);
    tle += line1 + checksum1 + '\n';
    // Line 2
    const line2Parts = [
        '2',
        omm.NORAD_CAT_ID.padStart(5, ' '),
        ' ',
        omm.INCLINATION.toFixed(4).padStart(8, ' '),
        ' ',
        omm.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' '),
        ' ',
        formatEccentricity(omm.ECCENTRICITY),
        ' ',
        omm.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' '),
        ' ',
        omm.MEAN_ANOMALY.toFixed(4).padStart(8, ' '),
        ' ',
        omm.MEAN_MOTION.toFixed(8).padStart(11, ' '),
        omm.REV_AT_EPOCH.toString().padStart(5, ' ')
    ];
    const line2 = line2Parts.join('');
    const checksum2 = calculateChecksum(line2);
    tle += line2 + checksum2;
    return tle;
}
/**
 * Serialize OMM to XML format
 */
function ommToXML(omm) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<omm xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
    xml += '     id="CCSDS_OMM_VERS" version="2.0">\n';
    xml += '  <header>\n';
    xml += `    <CREATION_DATE>${omm.CREATION_DATE}</CREATION_DATE>\n`;
    xml += `    <ORIGINATOR>${omm.ORIGINATOR}</ORIGINATOR>\n`;
    xml += '  </header>\n';
    xml += '  <body>\n';
    xml += '    <segment>\n';
    xml += '      <metadata>\n';
    xml += `        <OBJECT_NAME>${omm.OBJECT_NAME}</OBJECT_NAME>\n`;
    xml += `        <OBJECT_ID>${omm.OBJECT_ID}</OBJECT_ID>\n`;
    xml += `        <CENTER_NAME>${omm.CENTER_NAME}</CENTER_NAME>\n`;
    xml += `        <REF_FRAME>${omm.REF_FRAME}</REF_FRAME>\n`;
    xml += `        <TIME_SYSTEM>${omm.TIME_SYSTEM}</TIME_SYSTEM>\n`;
    xml += `        <MEAN_ELEMENT_THEORY>${omm.MEAN_ELEMENT_THEORY}</MEAN_ELEMENT_THEORY>\n`;
    xml += '      </metadata>\n';
    xml += '      <data>\n';
    xml += `        <EPOCH>${omm.EPOCH}</EPOCH>\n`;
    xml += `        <MEAN_MOTION>${omm.MEAN_MOTION}</MEAN_MOTION>\n`;
    xml += `        <ECCENTRICITY>${omm.ECCENTRICITY}</ECCENTRICITY>\n`;
    xml += `        <INCLINATION>${omm.INCLINATION}</INCLINATION>\n`;
    xml += `        <RA_OF_ASC_NODE>${omm.RA_OF_ASC_NODE}</RA_OF_ASC_NODE>\n`;
    xml += `        <ARG_OF_PERICENTER>${omm.ARG_OF_PERICENTER}</ARG_OF_PERICENTER>\n`;
    xml += `        <MEAN_ANOMALY>${omm.MEAN_ANOMALY}</MEAN_ANOMALY>\n`;
    xml += `        <BSTAR>${omm.BSTAR}</BSTAR>\n`;
    xml += `        <MEAN_MOTION_DOT>${omm.MEAN_MOTION_DOT}</MEAN_MOTION_DOT>\n`;
    xml += `        <MEAN_MOTION_DDOT>${omm.MEAN_MOTION_DDOT}</MEAN_MOTION_DDOT>\n`;
    xml += '      </data>\n';
    xml += '    </segment>\n';
    xml += '  </body>\n';
    xml += '</omm>\n';
    return xml;
}
// ============================================================================
// STK EPHEMERIS FORMAT CONVERSION
// ============================================================================
/**
 * Convert TLE to STK .e ephemeris format
 */
function tleToSTK(tle, _duration = 86400) {
    // For a full implementation, we would propagate the orbit
    // Here we provide a simplified structure
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        header: {
            version: 'stk.v.11.0',
            satelliteName: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
            coordinateSystem: 'TEME',
            centralBody: 'Earth'
        },
        stateVectors: [
            // This would typically include propagated state vectors
            // For now, we include just the epoch state
            {
                time: epoch.toISOString(),
                position: { x: 0, y: 0, z: 0 }, // Would calculate from TLE
                velocity: { vx: 0, vy: 0, vz: 0 } // Would calculate from TLE
            }
        ]
    };
}
/**
 * Serialize STK ephemeris to .e file format
 */
function stkToFile(stk) {
    let content = `stk.v.11.0\n\n`;
    content += `# Satellite: ${stk.header.satelliteName}\n`;
    content += `# Coordinate System: ${stk.header.coordinateSystem}\n`;
    content += `# Central Body: ${stk.header.centralBody}\n\n`;
    content += `BEGIN Ephemeris\n\n`;
    content += `NumberOfEphemerisPoints ${stk.stateVectors.length}\n\n`;
    content += `EphemerisTimePosVel\n\n`;
    for (const sv of stk.stateVectors) {
        const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
        content += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
        content += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
    }
    content += `\nEND Ephemeris\n`;
    return content;
}
// ============================================================================
// KVN (KEYHOLE MARKUP LANGUAGE) CONVERSION
// ============================================================================
/**
 * Convert TLE to KVN format
 */
function tleToKVN(tle, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    return {
        KVN_VERS: '1.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        elements: {
            EPOCH: epoch.toISOString(),
            MEAN_MOTION: parseFloat(tle.meanMotion),
            ECCENTRICITY: parseFloat(tle.eccentricity),
            INCLINATION: parseFloat(tle.inclination),
            RA_OF_ASC_NODE: parseFloat(tle.rightAscension),
            ARG_OF_PERICENTER: parseFloat(tle.argumentOfPerigee),
            MEAN_ANOMALY: parseFloat(tle.meanAnomaly),
            BSTAR: parseFloat(tle.bStar),
            MEAN_MOTION_DOT: parseFloat(tle.firstDerivative),
            MEAN_MOTION_DDOT: parseFloat(tle.secondDerivative)
        }
    };
}
/**
 * Serialize KVN to text format
 */
function kvnToText(kvn) {
    let text = `KVN/1.0\n\n`;
    text += `CREATION_DATE = ${kvn.CREATION_DATE}\n`;
    text += `ORIGINATOR = ${kvn.ORIGINATOR}\n\n`;
    text += `OBJECT_NAME = ${kvn.OBJECT_NAME}\n`;
    text += `OBJECT_ID = ${kvn.OBJECT_ID}\n\n`;
    text += `ELEMENTS\n`;
    for (const [key, value] of Object.entries(kvn.elements)) {
        text += `  ${key} = ${value}\n`;
    }
    return text;
}
// ============================================================================
// CCSDS OEM CONVERSION
// ============================================================================
/**
 * Convert TLE to CCSDS OEM format
 */
function tleToOEM(tle, duration = 86400, originator = 'TLE-PARSER') {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    const startTime = new Date(epoch.getTime());
    const stopTime = new Date(epoch.getTime() + duration * 1000);
    return {
        CCSDS_OEM_VERS: '2.0',
        CREATION_DATE: new Date().toISOString(),
        ORIGINATOR: originator,
        OBJECT_NAME: tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`,
        OBJECT_ID: tle.satelliteNumber1,
        CENTER_NAME: 'EARTH',
        REF_FRAME: 'TEME',
        TIME_SYSTEM: 'UTC',
        START_TIME: startTime.toISOString(),
        STOP_TIME: stopTime.toISOString(),
        USEABLE_START_TIME: startTime.toISOString(),
        USEABLE_STOP_TIME: stopTime.toISOString(),
        INTERPOLATION: 'HERMITE',
        INTERPOLATION_DEGREE: 7,
        ephemerisData: [
            // Would include propagated state vectors
            {
                time: epoch.toISOString(),
                position: { x: 0, y: 0, z: 0 },
                velocity: { vx: 0, vy: 0, vz: 0 }
            }
        ]
    };
}
/**
 * Serialize OEM to text format
 */
function oemToText(oem) {
    let text = `CCSDS_OEM_VERS = ${oem.CCSDS_OEM_VERS}\n`;
    text += `CREATION_DATE = ${oem.CREATION_DATE}\n`;
    text += `ORIGINATOR = ${oem.ORIGINATOR}\n\n`;
    text += `META_START\n`;
    text += `OBJECT_NAME = ${oem.OBJECT_NAME}\n`;
    text += `OBJECT_ID = ${oem.OBJECT_ID}\n`;
    text += `CENTER_NAME = ${oem.CENTER_NAME}\n`;
    text += `REF_FRAME = ${oem.REF_FRAME}\n`;
    text += `TIME_SYSTEM = ${oem.TIME_SYSTEM}\n`;
    text += `START_TIME = ${oem.START_TIME}\n`;
    text += `STOP_TIME = ${oem.STOP_TIME}\n`;
    text += `INTERPOLATION = ${oem.INTERPOLATION}\n`;
    text += `INTERPOLATION_DEGREE = ${oem.INTERPOLATION_DEGREE}\n`;
    text += `META_STOP\n\n`;
    text += `DATA_START\n`;
    for (const sv of oem.ephemerisData) {
        const time = typeof sv.time === 'string' ? sv.time : sv.time.toISOString();
        text += `${time} ${sv.position.x} ${sv.position.y} ${sv.position.z} `;
        text += `${sv.velocity.vx} ${sv.velocity.vy} ${sv.velocity.vz}\n`;
    }
    text += `DATA_STOP\n`;
    return text;
}
// ============================================================================
// KEPLERIAN ELEMENTS EXTRACTION
// ============================================================================
/**
 * Extract Keplerian elements from TLE
 */
function extractKeplerianElements(tle) {
    const meanMotion = parseFloat(tle.meanMotion);
    const eccentricity = parseFloat(tle.eccentricity);
    const inclination = parseFloat(tle.inclination);
    const raan = parseFloat(tle.rightAscension);
    const argPerigee = parseFloat(tle.argumentOfPerigee);
    const meanAnomaly = parseFloat(tle.meanAnomaly);
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    // Calculate semi-major axis from mean motion
    const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
    const n = meanMotion * 2 * Math.PI / 86400; // Convert to rad/s
    const semiMajorAxis = Math.pow(mu / (n * n), 1 / 3);
    // Calculate period
    const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
    // Calculate true anomaly from mean anomaly
    const trueAnomaly = meanAnomalyToTrueAnomaly(meanAnomaly * Math.PI / 180, eccentricity) * 180 / Math.PI;
    return {
        semiMajorAxis,
        eccentricity,
        inclination,
        rightAscensionOfAscendingNode: raan,
        argumentOfPerigee: argPerigee,
        meanAnomaly,
        trueAnomaly,
        epoch,
        meanMotion: n,
        period
    };
}
// ============================================================================
// STATE VECTOR CONVERSION
// ============================================================================
/**
 * Convert TLE to state vector at epoch
 * Note: This is a simplified conversion. For accurate propagation, use SGP4.
 */
function tleToStateVector(tle) {
    const keplerianElements = extractKeplerianElements(tle);
    // Convert Keplerian elements to Cartesian coordinates
    const { position, velocity } = keplerianToCartesian(keplerianElements);
    return {
        time: keplerianElements.epoch,
        position,
        velocity
    };
}
/**
 * Convert Keplerian elements to Cartesian state vector
 */
function keplerianToCartesian(elements) {
    const a = elements.semiMajorAxis;
    const e = elements.eccentricity;
    const i = elements.inclination * Math.PI / 180;
    const raan = elements.rightAscensionOfAscendingNode * Math.PI / 180;
    const omega = elements.argumentOfPerigee * Math.PI / 180;
    const nu = (elements.trueAnomaly || 0) * Math.PI / 180;
    const mu = 398600.4418; // km³/s²
    // Position in orbital plane
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);
    // Velocity in orbital plane
    const h = Math.sqrt(mu * a * (1 - e * e));
    const vx_orb = -mu / h * Math.sin(nu);
    const vy_orb = mu / h * (e + Math.cos(nu));
    // Rotation matrices
    const cosRaan = Math.cos(raan);
    const sinRaan = Math.sin(raan);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    // Transform to inertial frame
    const x = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * x_orb +
        (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * y_orb;
    const y = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * x_orb +
        (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * y_orb;
    const z = (sinOmega * sinI) * x_orb + (cosOmega * sinI) * y_orb;
    const vx = (cosRaan * cosOmega - sinRaan * sinOmega * cosI) * vx_orb +
        (-cosRaan * sinOmega - sinRaan * cosOmega * cosI) * vy_orb;
    const vy = (sinRaan * cosOmega + cosRaan * sinOmega * cosI) * vx_orb +
        (-sinRaan * sinOmega + cosRaan * cosOmega * cosI) * vy_orb;
    const vz = (sinOmega * sinI) * vx_orb + (cosOmega * sinI) * vy_orb;
    return {
        position: { x, y, z },
        velocity: { vx, vy, vz }
    };
}
// ============================================================================
// GPS ALMANAC CONVERSION
// ============================================================================
/**
 * Convert TLE to GPS almanac format (simplified)
 */
function tleToGPSAlmanac(tle) {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    const keplerianElements = extractKeplerianElements(tle);
    // GPS week number (starts from Jan 6, 1980)
    const gpsEpoch = new Date('1980-01-06T00:00:00Z');
    const weekNumber = Math.floor((epoch.getTime() - gpsEpoch.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return {
        satelliteId: tle.satelliteNumber1,
        health: 0, // Assume healthy
        eccentricity: parseFloat(tle.eccentricity),
        timeOfApplicability: epoch.getTime() / 1000, // seconds
        orbitalInclination: parseFloat(tle.inclination) * Math.PI / 180,
        rateOfRightAscension: 0, // Would need to calculate
        sqrtSemiMajorAxis: Math.sqrt(keplerianElements.semiMajorAxis),
        rightAscensionAtWeek: parseFloat(tle.rightAscension) * Math.PI / 180,
        argumentOfPerigee: parseFloat(tle.argumentOfPerigee) * Math.PI / 180,
        meanAnomaly: parseFloat(tle.meanAnomaly) * Math.PI / 180,
        af0: 0, // Clock correction parameters would need additional data
        af1: 0,
        week: weekNumber
    };
}
// ============================================================================
// COORDINATE FRAME TRANSFORMATIONS
// ============================================================================
/**
 * Transform state vector between coordinate frames
 * Note: This is a simplified implementation
 */
function transformCoordinateFrame(stateVector, fromFrame, toFrame, time) {
    if (fromFrame === toFrame) {
        return stateVector;
    }
    // For TEME to J2000 transformation (simplified)
    if (fromFrame === CoordinateFrame.TEME && toFrame === CoordinateFrame.J2000) {
        return temeToJ2000(stateVector, time);
    }
    // For J2000 to TEME transformation
    if (fromFrame === CoordinateFrame.J2000 && toFrame === CoordinateFrame.TEME) {
        return j2000ToTEME(stateVector, time);
    }
    // Default: return unchanged (placeholder)
    return stateVector;
}
/**
 * Transform from TEME to J2000 (simplified)
 */
function temeToJ2000(sv, _time) {
    // This is a placeholder. Real transformation requires:
    // 1. Precession matrix
    // 2. Nutation matrix
    // 3. Earth rotation angle
    // For now, return unchanged
    return sv;
}
/**
 * Transform from J2000 to TEME (simplified)
 */
function j2000ToTEME(sv, _time) {
    // Inverse of TEME to J2000
    return sv;
}
// ============================================================================
// PLANETARIUM SOFTWARE FORMATS
// ============================================================================
/**
 * Convert TLE to Stellarium format
 */
function tleToStellarium(tle) {
    const name = tle.satelliteName || `SATELLITE ${tle.satelliteNumber1}`;
    return `["${name}","${tle.lineNumber1} ${tle.satelliteNumber1}${tle.classification}...","${tle.lineNumber2} ${tle.satelliteNumber2}..."]`;
}
/**
 * Convert TLE to Celestia SSC format
 */
function tleToCelestia(tle) {
    const keplerianElements = extractKeplerianElements(tle);
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    let ssc = `"${tle.satelliteName || tle.satelliteNumber1}" "Sol/Earth"\n{\n`;
    ssc += `  Class "spacecraft"\n`;
    ssc += `  Mesh "satellite.3ds"\n`;
    ssc += `  Radius 0.01\n\n`;
    ssc += `  EllipticalOrbit\n  {\n`;
    ssc += `    Epoch ${epoch.getTime() / 1000}\n`;
    ssc += `    SemiMajorAxis ${keplerianElements.semiMajorAxis}\n`;
    ssc += `    Eccentricity ${keplerianElements.eccentricity}\n`;
    ssc += `    Inclination ${keplerianElements.inclination}\n`;
    ssc += `    AscendingNode ${keplerianElements.rightAscensionOfAscendingNode}\n`;
    ssc += `    ArgOfPericenter ${keplerianElements.argumentOfPerigee}\n`;
    ssc += `    MeanAnomaly ${keplerianElements.meanAnomaly}\n`;
    ssc += `  }\n}\n`;
    return ssc;
}
/**
 * Convert to generic planetarium format
 */
function tleToPlanetarium(tle, format) {
    switch (format) {
        case PlanetariumFormat.STELLARIUM:
            return tleToStellarium(tle);
        case PlanetariumFormat.CELESTIA:
            return tleToCelestia(tle);
        case PlanetariumFormat.SPACENGINE:
        case PlanetariumFormat.UNIVERSESANDBOX:
            // Would implement specific formats
            return JSON.stringify(extractKeplerianElements(tle), null, 2);
        default:
            return JSON.stringify(tle, null, 2);
    }
}
// ============================================================================
// CUSTOM FORMAT DEFINITION SYSTEM
// ============================================================================
/**
 * Convert TLE to custom format
 */
function tleToCustomFormat(tle, format) {
    let output = format.header || '';
    const separator = format.separator || ',';
    const lineEnding = format.lineEnding || '\n';
    const values = [];
    for (const field of format.fields) {
        let value = tle[field.source];
        // Apply transformation if provided
        if (field.transform) {
            value = field.transform(value);
        }
        // Apply formatting if provided
        if (field.format && typeof value === 'number') {
            // Simple formatting support
            value = value.toFixed(parseInt(field.format) || 0);
        }
        values.push(String(value));
    }
    output += values.join(separator) + lineEnding;
    output += format.footer || '';
    return output;
}
/**
 * Create custom format definition
 */
function createCustomFormat(name, fields, options = {}) {
    return {
        name,
        version: '1.0',
        fields,
        separator: options.separator,
        lineEnding: options.lineEnding,
        header: options.header,
        footer: options.footer
    };
}
// ============================================================================
// LEGACY TLE FORMAT SUPPORT
// ============================================================================
/**
 * Convert modern TLE to legacy format (if different)
 */
function tleToLegacyFormat(tle) {
    // Most TLE formats are compatible, but older systems may have different requirements
    // This would handle any legacy-specific formatting
    return reconstructTLE(tle);
}
/**
 * Reconstruct TLE string from ParsedTLE object
 */
function reconstructTLE(tle) {
    let output = '';
    // Line 0 (satellite name)
    if (tle.satelliteName) {
        output += tle.satelliteName + '\n';
    }
    // Line 1
    output += `1 ${tle.satelliteNumber1}${tle.classification} `;
    output += `${tle.internationalDesignatorYear}${tle.internationalDesignatorLaunchNumber}${tle.internationalDesignatorPiece} `;
    output += `${tle.epochYear}${tle.epoch} `;
    output += `${tle.firstDerivative} `;
    output += `${tle.secondDerivative} `;
    output += `${tle.bStar} `;
    output += `${tle.ephemerisType} `;
    output += `${tle.elementSetNumber}`;
    output += tle.checksum1 + '\n';
    // Line 2
    output += `2 ${tle.satelliteNumber2} `;
    output += `${tle.inclination} `;
    output += `${tle.rightAscension} `;
    output += `${tle.eccentricity} `;
    output += `${tle.argumentOfPerigee} `;
    output += `${tle.meanAnomaly} `;
    output += `${tle.meanMotion}`;
    output += `${tle.revolutionNumber}`;
    output += tle.checksum2;
    return output;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Parse epoch from TLE format
 */
function parseEpoch(epochYear, epoch) {
    const year = parseInt(epochYear);
    const fullYear = year >= 57 ? 1900 + year : 2000 + year;
    const dayOfYear = parseFloat(epoch);
    const date = new Date(Date.UTC(fullYear, 0, 1));
    const millisInDay = 24 * 60 * 60 * 1000;
    date.setTime(date.getTime() + (dayOfYear - 1) * millisInDay);
    return date;
}
/**
 * Get day of year from date
 */
function getDayOfYear(date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const diff = date.getTime() - start.getTime();
    return 1 + diff / (24 * 60 * 60 * 1000);
}
/**
 * Format number in scientific notation for TLE
 */
function formatScientific(value, width) {
    const sign = value >= 0 ? ' ' : '-';
    const absValue = Math.abs(value);
    const exponent = Math.floor(Math.log10(absValue));
    const mantissa = absValue / Math.pow(10, exponent);
    return `${sign}${mantissa.toFixed(width - 4)}${exponent >= 0 ? '+' : ''}${exponent}`;
}
/**
 * Format eccentricity (without leading decimal point)
 */
function formatEccentricity(value) {
    return value.toFixed(7).substring(2);
}
/**
 * Format international designator
 */
function formatInternationalDesignator(objectId) {
    // This is simplified; real implementation would parse the object ID
    return objectId.padEnd(8, ' ');
}
/**
 * Calculate TLE checksum
 */
function calculateChecksum(line) {
    let sum = 0;
    for (const char of line) {
        if (char >= '0' && char <= '9') {
            sum += parseInt(char);
        }
        else if (char === '-') {
            sum += 1;
        }
    }
    return (sum % 10).toString();
}
/**
 * Convert mean anomaly to true anomaly using Newton's method
 */
function meanAnomalyToTrueAnomaly(M, e, tolerance = 1e-8) {
    // Solve Kepler's equation: M = E - e*sin(E)
    let E = M; // Initial guess
    let delta = 1;
    while (Math.abs(delta) > tolerance) {
        delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= delta;
    }
    // Convert eccentric anomaly to true anomaly
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    return nu;
}
//# sourceMappingURL=formatConversion.js.map