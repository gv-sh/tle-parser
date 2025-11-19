/**
 * WebGL Satellite Visualization Component
 *
 * Renders satellite orbits and positions using WebGL.
 * Compatible with vanilla JavaScript or any framework.
 */

import { ParsedTLE, calculatePosition } from 'tle-parser';

export interface WebGLVisualizationOptions {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  earthRadius?: number;
  cameraDistance?: number;
}

export class SatelliteVisualization {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private width: number;
  private height: number;
  private earthRadius: number;
  private cameraDistance: number;
  private animationId: number | null = null;

  constructor(options: WebGLVisualizationOptions) {
    this.canvas = options.canvas;
    this.width = options.width || this.canvas.width;
    this.height = options.height || this.canvas.height;
    this.earthRadius = options.earthRadius || 6371; // km
    this.cameraDistance = options.cameraDistance || 20000; // km

    const gl = this.canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    this.initGL();
  }

  private initGL() {
    const gl = this.gl;

    // Set viewport
    gl.viewport(0, 0, this.width, this.height);

    // Set clear color (space black)
    gl.clearColor(0.0, 0.0, 0.05, 1.0);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Create shaders and program
    this.createShaderProgram();
  }

  private createShaderProgram() {
    const gl = this.gl;

    // Vertex shader
    const vertexShaderSource = `
      attribute vec3 aPosition;
      attribute vec3 aColor;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying vec3 vColor;

      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        gl_PointSize = 5.0;
        vColor = aColor;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }
    `;

    const vertexShader = this.compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create shader program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Shader program failed to link');
    }

    gl.useProgram(program);
  }

  private compileShader(source: string, type: number): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  /**
   * Draw Earth as a sphere
   */
  drawEarth() {
    const gl = this.gl;

    // Create sphere vertices
    const vertices: number[] = [];
    const colors: number[] = [];
    const latBands = 30;
    const longBands = 30;

    for (let lat = 0; lat <= latBands; lat++) {
      const theta = (lat * Math.PI) / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let long = 0; long <= longBands; long++) {
        const phi = (long * 2 * Math.PI) / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        vertices.push(x * this.earthRadius, y * this.earthRadius, z * this.earthRadius);
        colors.push(0.2, 0.5, 0.8); // Earth blue
      }
    }

    // Draw sphere (simplified - just points for now)
    this.drawPoints(vertices, colors);
  }

  /**
   * Draw satellite position
   */
  drawSatellite(tle: ParsedTLE, time: Date = new Date()) {
    const position = calculatePosition(tle, time);

    // Convert lat/lon/alt to 3D coordinates
    const lat = position.latitude * (Math.PI / 180);
    const lon = position.longitude * (Math.PI / 180);
    const alt = position.altitude + this.earthRadius;

    const x = alt * Math.cos(lat) * Math.cos(lon);
    const y = alt * Math.sin(lat);
    const z = alt * Math.cos(lat) * Math.sin(lon);

    const vertices = [x, y, z];
    const colors = [1.0, 1.0, 0.0]; // Yellow for satellite

    this.drawPoints(vertices, colors);
  }

  /**
   * Draw orbit path
   */
  drawOrbit(tle: ParsedTLE, points: number = 100) {
    const vertices: number[] = [];
    const colors: number[] = [];

    const now = new Date();
    const period = (24 * 60) / tle.meanMotion; // Orbital period in minutes

    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() + (i * period * 60000) / points);
      const position = calculatePosition(tle, time);

      const lat = position.latitude * (Math.PI / 180);
      const lon = position.longitude * (Math.PI / 180);
      const alt = position.altitude + this.earthRadius;

      const x = alt * Math.cos(lat) * Math.cos(lon);
      const y = alt * Math.sin(lat);
      const z = alt * Math.cos(lat) * Math.sin(lon);

      vertices.push(x, y, z);
      colors.push(0.5, 0.5, 0.5); // Gray for orbit
    }

    this.drawLines(vertices, colors);
  }

  private drawPoints(vertices: number[], colors: number[]) {
    const gl = this.gl;

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Draw
    gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
  }

  private drawLines(vertices: number[], colors: number[]) {
    const gl = this.gl;

    // Similar to drawPoints but with LINE_STRIP
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 3);
  }

  /**
   * Render the scene
   */
  render(tles: ParsedTLE[], time: Date = new Date()) {
    const gl = this.gl;

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Earth
    this.drawEarth();

    // Draw satellites and orbits
    tles.forEach(tle => {
      this.drawOrbit(tle);
      this.drawSatellite(tle, time);
    });
  }

  /**
   * Start animation loop
   */
  startAnimation(tles: ParsedTLE[]) {
    const animate = () => {
      this.render(tles, new Date());
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAnimation();
  }
}
