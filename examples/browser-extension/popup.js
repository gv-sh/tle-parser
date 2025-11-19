// Import TLE parser (in production, use bundled version)
// This is a simplified example - you would bundle the library with your extension

const parseBtn = document.getElementById('parseBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const tleInput = document.getElementById('tleInput');
const result = document.getElementById('result');
const error = document.getElementById('error');

let currentTLE = null;

// Load saved TLE from storage
chrome.storage.local.get(['lastTLE'], (data) => {
  if (data.lastTLE) {
    tleInput.value = data.lastTLE;
  }
  updateStorageCount();
});

parseBtn.addEventListener('click', async () => {
  const tleText = tleInput.value.trim();
  if (!tleText) {
    showError('Please enter TLE data');
    return;
  }

  try {
    // In a real extension, you would import and use the actual parser
    // For this example, we'll do basic parsing
    const lines = tleText.split('\n').filter(l => l.trim());

    if (lines.length < 2) {
      throw new Error('TLE must have at least 2 lines');
    }

    // Simple validation (real implementation would use the actual library)
    const line1 = lines.length === 3 ? lines[1] : lines[0];
    const line2 = lines.length === 3 ? lines[2] : lines[1];
    const name = lines.length === 3 ? lines[0] : 'Unknown';

    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      throw new Error('Invalid TLE format');
    }

    // Extract basic fields (simplified)
    const satNumber = line1.substring(2, 7).trim();
    const classification = line1.charAt(7);
    const inclination = parseFloat(line2.substring(8, 16).trim());
    const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim());
    const meanMotion = parseFloat(line2.substring(52, 63).trim());

    currentTLE = {
      name,
      satelliteNumber: satNumber,
      classification,
      inclination,
      eccentricity,
      meanMotion,
      raw: tleText
    };

    displayResult(currentTLE);
    error.classList.remove('show');
  } catch (err) {
    showError(err.message);
    result.classList.remove('show');
  }
});

saveBtn.addEventListener('click', () => {
  if (!currentTLE) {
    showError('Parse TLE first');
    return;
  }

  chrome.storage.local.get(['savedTLEs'], (data) => {
    const savedTLEs = data.savedTLEs || [];
    savedTLEs.unshift(currentTLE);

    // Keep only last 50
    const trimmed = savedTLEs.slice(0, 50);

    chrome.storage.local.set({
      savedTLEs: trimmed,
      lastTLE: currentTLE.raw
    }, () => {
      alert('TLE saved!');
      updateStorageCount();
    });
  });
});

clearBtn.addEventListener('click', () => {
  tleInput.value = '';
  result.classList.remove('show');
  error.classList.remove('show');
  currentTLE = null;
});

function displayResult(tle) {
  document.getElementById('satName').textContent = tle.name || 'Satellite';
  document.getElementById('satNumber').textContent = tle.satelliteNumber;
  document.getElementById('classification').textContent = tle.classification;
  document.getElementById('inclination').textContent = tle.inclination.toFixed(4) + '°';
  document.getElementById('eccentricity').textContent = tle.eccentricity.toFixed(7);
  document.getElementById('meanMotion').textContent = tle.meanMotion.toFixed(8) + ' rev/day';
  result.classList.add('show');
}

function showError(message) {
  error.textContent = message;
  error.classList.add('show');
}

function updateStorageCount() {
  chrome.storage.local.get(['savedTLEs'], (data) => {
    const count = (data.savedTLEs || []).length;
    document.getElementById('storageCount').textContent = count;
  });
}
