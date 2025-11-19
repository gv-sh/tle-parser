"use strict";
/**
 * Constellation Definitions and Filters
 * Provides pre-defined satellite constellation groups and filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTELLATIONS = void 0;
exports.getConstellation = getConstellation;
exports.listConstellations = listConstellations;
exports.createConstellationFilter = createConstellationFilter;
exports.matchesConstellation = matchesConstellation;
exports.filterByConstellation = filterByConstellation;
exports.groupByConstellation = groupByConstellation;
/**
 * Pre-defined constellations
 */
exports.CONSTELLATIONS = {
    // Starlink
    starlink: {
        name: 'Starlink',
        description: 'SpaceX Starlink satellite constellation',
        namePatterns: [
            /^STARLINK-/i,
            /^STARLINK /i
        ],
        intlDesignatorPatterns: [
            /^\d{2}-(0[0-9]{2}|1[0-9]{2})[A-Z]{1,3}$/
        ]
    },
    // OneWeb
    oneweb: {
        name: 'OneWeb',
        description: 'OneWeb satellite constellation',
        namePatterns: [
            /^ONEWEB-/i,
            /^ONEWEB /i
        ]
    },
    // GPS
    gps: {
        name: 'GPS',
        description: 'Global Positioning System satellites',
        namePatterns: [
            /^GPS /i,
            /^NAVSTAR/i,
            /^USA-/i // Many GPS satellites
        ],
        catalogNumbers: [
            [20959, 20959], // GPS BIIA-1
            [22014, 22014], // GPS BIIA-2
            [22877, 22877], // GPS BIIA-3
            [23833, 23833], // GPS BIIA-4
            [24876, 24876], // GPS BIIA-5
            [25933, 25933], // GPS BIIA-6
            [26360, 26360], // GPS BIIA-7
            [26407, 26407], // GPS BIIA-8
            [26605, 26605], // GPS BIIA-9
            [26690, 26690], // GPS BIIA-10
            // GPS IIR
            [28361, 28361], // GPS BIIR-2
            [28474, 28474], // GPS BIIR-3
            [28874, 28874], // GPS BIIR-4
            [29486, 29486], // GPS BIIR-5
            [29601, 29601], // GPS BIIR-6
            [32260, 32260], // GPS BIIR-7
            [32384, 32384], // GPS BIIR-8
            [32711, 32711], // GPS BIIR-9
            [35752, 35752], // GPS BIIR-10
            [36585, 36585], // GPS BIIR-11
            [37753, 37753], // GPS BIIR-12
            [38833, 38833], // GPS BIIR-13
            [39166, 39166], // GPS BIIR-14
            [40105, 40105], // GPS BIIR-15
            [40294, 40294], // GPS BIIR-16
            [40534, 40534], // GPS BIIR-17
            [40730, 40730], // GPS BIIR-18
            [41019, 41019], // GPS BIIR-19
            [41328, 41328], // GPS BIIR-20
            // GPS IIF and III ranges
            [36500, 36600],
            [40000, 41400]
        ]
    },
    // Galileo
    galileo: {
        name: 'Galileo',
        description: 'European GNSS constellation',
        namePatterns: [
            /^GALILEO/i,
            /^GSAT/i
        ],
        catalogNumbers: [
            [37846, 37846], // GSAT0101
            [37847, 37847], // GSAT0102
            [38857, 38857], // GSAT0103
            [38858, 38858], // GSAT0104
            [40128, 40128], // GSAT0201
            [40129, 40129], // GSAT0202
            [40544, 40544], // GSAT0203
            [40545, 40545], // GSAT0204
            [40889, 40889], // GSAT0205
            [40890, 40890], // GSAT0206
            [41174, 41174], // GSAT0207
            [41175, 41175], // GSAT0208
            [41549, 41549], // GSAT0209
            [41550, 41550], // GSAT0210
            [41859, 41859], // GSAT0211
            [41860, 41860], // GSAT0212
            [41861, 41861], // GSAT0213
            [41862, 41862], // GSAT0214
            [43055, 43055], // GSAT0215
            [43056, 43056], // GSAT0216
            [43057, 43057], // GSAT0217
            [43058, 43058], // GSAT0218
            [43564, 43564], // GSAT0219
            [43565, 43565], // GSAT0220
            [43566, 43566], // GSAT0221
            [43567, 43567] // GSAT0222
        ]
    },
    // GLONASS
    glonass: {
        name: 'GLONASS',
        description: 'Russian GNSS constellation',
        namePatterns: [
            /^COSMOS \d+$/i,
            /^GLONASS/i
        ],
        catalogNumbers: [
            // GLONASS-M
            [28915, 28915], // Cosmos 2424
            [32275, 32275], // Cosmos 2425
            [32276, 32276], // Cosmos 2426
            [32393, 32393], // Cosmos 2427
            [32395, 32395], // Cosmos 2428
            [36111, 36111], // Cosmos 2429
            [36112, 36112], // Cosmos 2430
            [36113, 36113], // Cosmos 2431
            [36400, 36400], // Cosmos 2432
            [36401, 36401], // Cosmos 2433
            [36402, 36402], // Cosmos 2434
            [37139, 37139], // Cosmos 2435
            [37140, 37140], // Cosmos 2436
            [37141, 37141], // Cosmos 2437
            [37829, 37829], // Cosmos 2438
            [37869, 37869], // Cosmos 2439
            [37870, 37870], // Cosmos 2440
            [39155, 39155], // Cosmos 2441
            [39620, 39620], // Cosmos 2442
            [39621, 39621], // Cosmos 2443
            [39622, 39622], // Cosmos 2444
            [40001, 40001], // Cosmos 2445
            [40315, 40315], // Cosmos 2446
            [40315, 40315], // Cosmos 2447
            [41330, 41330], // Cosmos 2448
            [41554, 41554], // Cosmos 2449
            [41555, 41555], // Cosmos 2450
            // GLONASS-K
            [36400, 36410],
            [37800, 37900],
            [39100, 39700],
            [40000, 41600]
        ]
    },
    // BeiDou
    beidou: {
        name: 'BeiDou',
        description: 'Chinese GNSS constellation',
        namePatterns: [
            /^BEIDOU/i,
            /^BDS/i,
            /^COMPASS/i
        ],
        catalogNumbers: [
            [36287, 36287], // BeiDou-3 M1
            [36828, 36828], // BeiDou-3 M2
            [37210, 37210], // BeiDou-3 M3
            [37384, 37384], // BeiDou-3 M4
            [37763, 37763], // BeiDou-3 M5
            [37948, 37948], // BeiDou-3 M6
            [38091, 38091], // BeiDou-3 M7
            [38250, 38250], // BeiDou-3 M8
            [38251, 38251], // BeiDou-3 M9
            [38775, 38775], // BeiDou-3 M10
            [40549, 40549], // BeiDou-3 M11
            [40748, 40748], // BeiDou-3 M12
            [40749, 40749], // BeiDou-3 M13
            [40938, 40938], // BeiDou-3 M14
            [41434, 41434], // BeiDou-3 M15
            [41586, 41586], // BeiDou-3 M16
            [43001, 43001], // BeiDou-3 M17
            [43002, 43002], // BeiDou-3 M18
            [43107, 43107], // BeiDou-3 M19
            [43108, 43108], // BeiDou-3 M20
            [43207, 43207], // BeiDou-3 M21
            [43208, 43208], // BeiDou-3 M22
            [43245, 43245], // BeiDou-3 M23
            [43246, 43246], // BeiDou-3 M24
            // BeiDou-3 range
            [36200, 43300]
        ]
    },
    // ISS
    iss: {
        name: 'ISS',
        description: 'International Space Station',
        catalogNumbers: [25544],
        namePatterns: [/^ISS/i]
    },
    // Amateur Radio
    amateur: {
        name: 'Amateur Radio',
        description: 'Amateur radio satellites',
        namePatterns: [
            /^AO-/i, // AMSAT Oscar
            /^SO-/i, // Surrey Oscar
            /^FO-/i, // Fuji Oscar
            /^FUNCUBE/i, // FUNcube
            /^LILACSAT/i, // LilacSat
            /^DIWATA/i, // Diwata
            /^OSCAR/i, // Oscar
            /^AMSAT/i, // AMSAT
            /^CUBESAT/i, // CubeSat
            /^RS-/i, // Radio Sputnik
            /^ZARYA/i // Zarya
        ]
    },
    // Weather satellites
    weather: {
        name: 'Weather',
        description: 'Weather and meteorological satellites',
        namePatterns: [
            /^NOAA /i,
            /^GOES /i,
            /^METEOSAT/i,
            /^METEOR/i,
            /^FENGYUN/i,
            /^FY-/i,
            /^HIMAWARI/i
        ]
    },
    // Iridium
    iridium: {
        name: 'Iridium',
        description: 'Iridium satellite constellation',
        namePatterns: [
            /^IRIDIUM/i
        ],
        catalogNumbers: [
            // Iridium NEXT
            [41917, 41927], // First 10
            [41934, 41944], // Next 10
            [42803, 42813], // Next 10
            [42955, 42965], // Next 10
            [43070, 43080], // Next 10
            [43249, 43259], // Next 10
            [43478, 43488], // Next 10
            [43569, 43579] // Last batch
        ]
    },
    // Planet Labs
    planet: {
        name: 'Planet Labs',
        description: 'Planet Labs Earth imaging satellites',
        namePatterns: [
            /^DOVE/i,
            /^FLOCK/i,
            /^PLANET/i,
            /^SKYSAT/i
        ]
    },
    // Spire
    spire: {
        name: 'Spire',
        description: 'Spire Global satellite constellation',
        namePatterns: [
            /^LEMUR/i,
            /^SPIRE/i
        ]
    }
};
/**
 * Get constellation by name
 */
function getConstellation(name) {
    return exports.CONSTELLATIONS[name.toLowerCase()];
}
/**
 * List all available constellations
 */
function listConstellations() {
    return Object.keys(exports.CONSTELLATIONS);
}
/**
 * Create a TLE filter for a constellation
 */
function createConstellationFilter(constellationName) {
    const constellation = getConstellation(constellationName);
    if (!constellation)
        return undefined;
    const filter = {};
    // Add satellite number filter
    if (constellation.catalogNumbers && constellation.catalogNumbers.length > 0) {
        filter.satelliteNumber = (satNum) => {
            const num = parseInt(satNum, 10);
            if (isNaN(num))
                return false;
            return constellation.catalogNumbers.some(range => {
                if (Array.isArray(range)) {
                    return num >= range[0] && num <= range[1];
                }
                return num === range;
            });
        };
    }
    // Add name pattern filter
    if (constellation.namePatterns && constellation.namePatterns.length > 0) {
        const originalNameFilter = filter.satelliteName;
        filter.satelliteName = (name) => {
            const matchesPattern = constellation.namePatterns.some(pattern => pattern.test(name));
            if (originalNameFilter && typeof originalNameFilter === 'function') {
                return matchesPattern && originalNameFilter(name);
            }
            return matchesPattern;
        };
    }
    // Add custom filter
    if (constellation.customFilter) {
        const originalCustomFilter = filter.custom;
        filter.custom = (tle) => {
            const matchesCustom = constellation.customFilter(tle);
            if (originalCustomFilter) {
                return matchesCustom && originalCustomFilter(tle);
            }
            return matchesCustom;
        };
    }
    return filter;
}
/**
 * Check if a TLE matches a constellation
 */
function matchesConstellation(tle, constellationName) {
    const constellation = getConstellation(constellationName);
    if (!constellation)
        return false;
    // Check catalog numbers
    if (constellation.catalogNumbers && constellation.catalogNumbers.length > 0) {
        const satNum = parseInt(tle.satelliteNumber1, 10);
        if (!isNaN(satNum)) {
            const matchesCatalog = constellation.catalogNumbers.some(range => {
                if (Array.isArray(range)) {
                    return satNum >= range[0] && satNum <= range[1];
                }
                return satNum === range;
            });
            if (matchesCatalog)
                return true;
        }
    }
    // Check name patterns
    if (constellation.namePatterns && tle.satelliteName) {
        const matchesName = constellation.namePatterns.some(pattern => pattern.test(tle.satelliteName));
        if (matchesName)
            return true;
    }
    // Check custom filter
    if (constellation.customFilter) {
        return constellation.customFilter(tle);
    }
    return false;
}
/**
 * Filter TLEs by constellation
 */
function filterByConstellation(tles, constellationName) {
    return tles.filter(tle => matchesConstellation(tle, constellationName));
}
/**
 * Group TLEs by constellation
 */
function groupByConstellation(tles) {
    const groups = new Map();
    for (const tle of tles) {
        let matched = false;
        for (const [name] of Object.entries(exports.CONSTELLATIONS)) {
            if (matchesConstellation(tle, name)) {
                if (!groups.has(name)) {
                    groups.set(name, []);
                }
                groups.get(name).push(tle);
                matched = true;
                break; // Each TLE belongs to only one constellation
            }
        }
        if (!matched) {
            if (!groups.has('unknown')) {
                groups.set('unknown', []);
            }
            groups.get('unknown').push(tle);
        }
    }
    return groups;
}
//# sourceMappingURL=constellations.js.map