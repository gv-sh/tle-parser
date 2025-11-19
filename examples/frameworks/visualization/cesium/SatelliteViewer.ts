/**
 * Cesium.js 3D Globe Visualization
 *
 * Integrates TLE Parser with Cesium for 3D satellite visualization on a globe.
 */

import * as Cesium from 'cesium';
import { ParsedTLE, calculatePosition } from 'tle-parser';

export interface CesiumViewerOptions {
  container: string | HTMLElement;
  cesiumToken?: string;
}

export class SatelliteViewer {
  private viewer: Cesium.Viewer;
  private satellites: Map<string, Cesium.Entity> = new Map();
  private animationCallbacks: (() => void)[] = [];

  constructor(options: CesiumViewerOptions) {
    // Set Cesium Ion token if provided
    if (options.cesiumToken) {
      Cesium.Ion.defaultAccessToken = options.cesiumToken;
    }

    // Create viewer
    this.viewer = new Cesium.Viewer(options.container, {
      terrainProvider: Cesium.createWorldTerrain(),
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'stars.jpg',
          negativeX: 'stars.jpg',
          positiveY: 'stars.jpg',
          negativeY: 'stars.jpg',
          positiveZ: 'stars.jpg',
          negativeZ: 'stars.jpg'
        }
      }),
      baseLayerPicker: false,
      geocoder: false
    });
  }

  /**
   * Add satellite to the viewer
   */
  addSatellite(tle: ParsedTLE, options: { color?: Cesium.Color; showOrbit?: boolean } = {}) {
    const color = options.color || Cesium.Color.YELLOW;
    const showOrbit = options.showOrbit !== false;

    // Calculate initial position
    const position = calculatePosition(tle, new Date());

    // Create entity
    const entity = this.viewer.entities.add({
      id: `sat-${tle.satelliteNumber}`,
      name: tle.satelliteName || `Satellite ${tle.satelliteNumber}`,
      position: Cesium.Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        position.altitude * 1000 // Convert km to meters
      ),
      point: {
        pixelSize: 10,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: tle.satelliteName || `SAT ${tle.satelliteNumber}`,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15)
      }
    });

    // Add orbit path
    if (showOrbit) {
      this.addOrbitPath(tle, color);
    }

    this.satellites.set(`sat-${tle.satelliteNumber}`, entity);

    return entity;
  }

  /**
   * Add orbit path visualization
   */
  private addOrbitPath(tle: ParsedTLE, color: Cesium.Color) {
    const positions: Cesium.Cartesian3[] = [];
    const now = new Date();
    const period = (24 * 60) / tle.meanMotion; // minutes
    const points = 100;

    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() + (i * period * 60000) / points);
      const pos = calculatePosition(tle, time);
      positions.push(
        Cesium.Cartesian3.fromDegrees(
          pos.longitude,
          pos.latitude,
          pos.altitude * 1000
        )
      );
    }

    this.viewer.entities.add({
      id: `orbit-${tle.satelliteNumber}`,
      polyline: {
        positions: positions,
        width: 2,
        material: color.withAlpha(0.5)
      }
    });
  }

  /**
   * Update satellite position
   */
  updateSatellite(satelliteId: string, tle: ParsedTLE) {
    const entity = this.satellites.get(satelliteId);
    if (!entity) return;

    const position = calculatePosition(tle, new Date());

    entity.position = new Cesium.ConstantPositionProperty(
      Cesium.Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        position.altitude * 1000
      )
    );
  }

  /**
   * Start real-time tracking
   */
  startTracking(tles: ParsedTLE[], updateInterval: number = 1000) {
    const interval = setInterval(() => {
      tles.forEach(tle => {
        this.updateSatellite(`sat-${tle.satelliteNumber}`, tle);
      });
    }, updateInterval);

    this.animationCallbacks.push(() => clearInterval(interval));
  }

  /**
   * Focus camera on satellite
   */
  focusSatellite(satelliteId: string) {
    const entity = this.satellites.get(satelliteId);
    if (entity) {
      this.viewer.trackedEntity = entity;
    }
  }

  /**
   * Add ground station
   */
  addGroundStation(
    name: string,
    latitude: number,
    longitude: number,
    altitude: number = 0
  ) {
    return this.viewer.entities.add({
      id: `ground-${name}`,
      name: name,
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      point: {
        pixelSize: 8,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: name,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12)
      }
    });
  }

  /**
   * Draw line of sight from ground station to satellite
   */
  drawLineOfSight(stationId: string, satelliteId: string) {
    const station = this.viewer.entities.getById(`ground-${stationId}`);
    const satellite = this.satellites.get(satelliteId);

    if (station && satellite && station.position && satellite.position) {
      const stationPos = station.position.getValue(Cesium.JulianDate.now());
      const satellitePos = satellite.position.getValue(Cesium.JulianDate.now());

      if (stationPos && satellitePos) {
        this.viewer.entities.add({
          id: `los-${stationId}-${satelliteId}`,
          polyline: {
            positions: [stationPos, satellitePos],
            width: 2,
            material: Cesium.Color.GREEN.withAlpha(0.5)
          }
        });
      }
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.animationCallbacks.forEach(callback => callback());
    this.viewer.destroy();
  }
}
