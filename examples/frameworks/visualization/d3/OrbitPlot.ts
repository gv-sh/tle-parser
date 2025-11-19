/**
 * D3.js Orbit Visualization
 *
 * Creates 2D orbital plots and ground track visualizations using D3.js
 */

import * as d3 from 'd3';
import { ParsedTLE, calculatePosition } from 'tle-parser';

export interface OrbitPlotOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  showEarth?: boolean;
  showGrid?: boolean;
}

export class OrbitPlot {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private projection: d3.GeoProjection;

  constructor(options: OrbitPlotOptions) {
    this.container = options.container;
    this.width = options.width || 960;
    this.height = options.height || 500;

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Create projection (Equirectangular for simplicity)
    this.projection = d3.geoEquirectangular()
      .scale(this.width / (2 * Math.PI))
      .translate([this.width / 2, this.height / 2]);

    if (options.showEarth !== false) {
      this.drawEarth();
    }

    if (options.showGrid !== false) {
      this.drawGrid();
    }
  }

  /**
   * Draw Earth background
   */
  private drawEarth() {
    // Draw ocean
    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', '#4a90e2');

    // Draw land (simplified - just continents outline)
    const graticule = d3.geoGraticule();
    const path = d3.geoPath(this.projection);

    this.svg.append('path')
      .datum(graticule.outline())
      .attr('fill', '#2d5f3f')
      .attr('d', path);
  }

  /**
   * Draw coordinate grid
   */
  private drawGrid() {
    const graticule = d3.geoGraticule();
    const path = d3.geoPath(this.projection);

    this.svg.append('path')
      .datum(graticule())
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5)
      .attr('d', path);
  }

  /**
   * Plot ground track
   */
  plotGroundTrack(tle: ParsedTLE, options: { points?: number; color?: string; label?: boolean } = {}) {
    const points = options.points || 100;
    const color = options.color || '#ff6b6b';

    const now = new Date();
    const period = (24 * 60) / tle.meanMotion; // minutes

    const coordinates: [number, number][] = [];

    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() + (i * period * 60000) / points);
      const position = calculatePosition(tle, time);
      coordinates.push([position.longitude, position.latitude]);
    }

    // Create line generator
    const line = d3.line()
      .x(d => this.projection(d)![0])
      .y(d => this.projection(d)![1])
      .curve(d3.curveLinear);

    // Draw ground track
    this.svg.append('path')
      .datum(coordinates)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line as any);

    // Draw current position
    const currentPos = calculatePosition(tle, now);
    const projected = this.projection([currentPos.longitude, currentPos.latitude]);

    if (projected) {
      this.svg.append('circle')
        .attr('cx', projected[0])
        .attr('cy', projected[1])
        .attr('r', 5)
        .attr('fill', color);

      if (options.label !== false) {
        this.svg.append('text')
          .attr('x', projected[0] + 10)
          .attr('y', projected[1])
          .attr('font-size', '12px')
          .attr('fill', color)
          .text(tle.satelliteName || `SAT ${tle.satelliteNumber}`);
      }
    }
  }

  /**
   * Plot orbital elements as polar plot
   */
  plotOrbitalElements(tle: ParsedTLE) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 3;

    // Draw orbit ellipse (simplified as circle)
    this.svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#888')
      .attr('stroke-width', 2);

    // Draw inclination indicator
    const inclRad = tle.inclination * (Math.PI / 180);
    this.svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', centerX + radius * Math.cos(inclRad))
      .attr('y2', centerY - radius * Math.sin(inclRad))
      .attr('stroke', '#ff6b6b')
      .attr('stroke-width', 2);

    // Add labels
    this.svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY - radius - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text(`Inclination: ${tle.inclination.toFixed(2)}°`);
  }

  /**
   * Animate satellite position
   */
  animatePosition(tle: ParsedTLE, duration: number = 60000) {
    const currentPos = calculatePosition(tle, new Date());
    const projected = this.projection([currentPos.longitude, currentPos.latitude]);

    if (!projected) return;

    const circle = this.svg.append('circle')
      .attr('cx', projected[0])
      .attr('cy', projected[1])
      .attr('r', 5)
      .attr('fill', '#ff6b6b');

    // Animate along orbit
    const period = (24 * 60) / tle.meanMotion;
    const steps = 100;

    let currentStep = 0;
    const interval = setInterval(() => {
      const time = new Date(Date.now() + (currentStep * period * 60000) / steps);
      const pos = calculatePosition(tle, time);
      const proj = this.projection([pos.longitude, pos.latitude]);

      if (proj) {
        circle
          .attr('cx', proj[0])
          .attr('cy', proj[1]);
      }

      currentStep = (currentStep + 1) % steps;
    }, duration / steps);

    return () => clearInterval(interval);
  }

  /**
   * Clear all plots
   */
  clear() {
    this.svg.selectAll('*').remove();
    this.drawEarth();
    this.drawGrid();
  }
}
