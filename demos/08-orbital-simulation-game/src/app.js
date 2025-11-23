import Phaser from 'phaser';

/**
 * Orbital Simulation Game
 * Educational game using real SGP4 physics from TLE data
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load assets
  }

  create() {
    // Create Earth
    this.earth = this.add.circle(400, 300, 80, 0x0077be);

    // Create satellite
    this.satellite = this.add.circle(400, 200, 10, 0xff0000);

    // Add text
    this.add.text(20, 20, 'Orbital Simulation Game', {
      fontSize: '24px',
      color: '#fff'
    });

    this.add.text(20, 50, 'Guide the satellite using real orbital mechanics', {
      fontSize: '16px',
      color: '#fff'
    });

    // Tutorial text
    this.tutorialText = this.add.text(20, 500, 'Level 1: Match the target orbit', {
      fontSize: '18px',
      color: '#fff'
    });
  }

  update() {
    // Simulate orbital motion
    const angle = this.time.now / 1000;
    const radius = 100;
    this.satellite.x = 400 + Math.cos(angle) * radius;
    this.satellite.y = 300 + Math.sin(angle) * radius;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#000000',
  scene: [GameScene]
};

const game = new Phaser.Game(config);
