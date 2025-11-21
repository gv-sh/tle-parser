<template>
  <div class="sky-map">
    <canvas ref="canvas" width="800" height="800"></canvas>
    <div class="sky-map-legend">
      <h4>Legend</h4>
      <div class="legend-item">
        <span class="color-box" style="background: #667eea;"></span>
        <span>Satellite Path</span>
      </div>
      <div class="legend-item">
        <span class="color-box" style="background: #48bb78;"></span>
        <span>Rise Point</span>
      </div>
      <div class="legend-item">
        <span class="color-box" style="background: #f56565;"></span>
        <span>Set Point</span>
      </div>
      <div class="legend-item">
        <span class="color-box" style="background: #ed8936;"></span>
        <span>Max Elevation</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';

export default {
  name: 'SkyMap',
  props: {
    passes: {
      type: Array,
      required: true
    },
    selectedPass: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const canvas = ref(null);

    const drawSkyMap = () => {
      if (!canvas.value) return;

      const ctx = canvas.value.getContext('2d');
      const width = canvas.value.width;
      const height = canvas.value.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 40;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#f7fafc';
      ctx.fillRect(0, 0, width, height);

      // Draw horizon circle
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw elevation circles (30°, 60°, 90°)
      ctx.strokeStyle = '#cbd5e0';
      ctx.lineWidth = 1;
      [30, 60, 90].forEach((elevation, index) => {
        const r = radius * (1 - elevation / 90);
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#718096';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${elevation}°`, centerX + r + 5, centerY);
      });

      // Draw cardinal directions
      ctx.fillStyle = '#2d3748';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText('N', centerX, centerY - radius - 20);
      ctx.fillText('S', centerX, centerY + radius + 20);
      ctx.fillText('E', centerX + radius + 20, centerY);
      ctx.fillText('W', centerX - radius - 20, centerY);

      // Draw azimuth lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let az = 0; az < 360; az += 30) {
        const rad = (az - 90) * Math.PI / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw passes
      props.passes.forEach((pass, index) => {
        drawPass(ctx, pass, centerX, centerY, radius, index === 0);
      });
    };

    const drawPass = (ctx, pass, centerX, centerY, radius, isFirst) => {
      // Convert azimuth/elevation to canvas coordinates
      const polarToCartesian = (azimuth, elevation) => {
        const r = radius * (1 - elevation / 90);
        const rad = (azimuth - 90) * Math.PI / 180;
        return {
          x: centerX + r * Math.cos(rad),
          y: centerY + r * Math.sin(rad)
        };
      };

      const risePos = polarToCartesian(pass.rise.azimuth, 0);
      const maxPos = polarToCartesian(pass.maxElevation.azimuth, pass.maxElevation.elevation);
      const setPos = polarToCartesian(pass.set.azimuth, 0);

      // Draw path
      ctx.strokeStyle = isFirst ? '#667eea' : 'rgba(102, 126, 234, 0.3)';
      ctx.lineWidth = isFirst ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(risePos.x, risePos.y);
      ctx.quadraticCurveTo(
        maxPos.x, maxPos.y,
        setPos.x, setPos.y
      );
      ctx.stroke();

      // Draw points
      if (isFirst) {
        // Rise point (green)
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        ctx.arc(risePos.x, risePos.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Max elevation point (orange)
        ctx.fillStyle = '#ed8936';
        ctx.beginPath();
        ctx.arc(maxPos.x, maxPos.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Set point (red)
        ctx.fillStyle = '#f56565';
        ctx.beginPath();
        ctx.arc(setPos.x, setPos.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    onMounted(() => {
      drawSkyMap();
    });

    watch(() => props.passes, () => {
      drawSkyMap();
    }, { deep: true });

    return {
      canvas
    };
  }
};
</script>

<style scoped>
.sky-map {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

canvas {
  max-width: 100%;
  height: auto;
}

.sky-map-legend {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.sky-map-legend h4 {
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 0.95rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #4a5568;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

@media (max-width: 768px) {
  canvas {
    width: 100%;
  }

  .sky-map-legend {
    position: static;
    margin-top: 20px;
  }
}
</style>
