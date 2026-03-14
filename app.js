const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const meshSizeInput = document.getElementById('meshSize');
const snapToggle = document.getElementById('snapToggle');
const resetBtn = document.getElementById('resetBtn');
const deviceButtons = document.querySelectorAll('.device-button');
const projectionSummary = document.getElementById('projectionSummary');
const deviceList = document.getElementById('deviceList');
const selectionPrompt = document.getElementById('selectionPrompt');
const deviceForm = document.getElementById('deviceForm');
const deviceName = document.getElementById('deviceName');
const posX = document.getElementById('posX');
const posY = document.getElementById('posY');
const angleInput = document.getElementById('angle');
const intensityInput = document.getElementById('intensity');
const reflectivityInput = document.getElementById('reflectivity');
const segmentLengthInput = document.getElementById('segmentLength');

const deviceDefaults = {
  laser: {
    label: 'Laser Source',
    angle: 0,
    intensity: 85,
    reflectivity: 100,
    length: 70,
  },
  mirror: {
    label: 'Galvanized Mirror',
    angle: 45,
    intensity: 0,
    reflectivity: 90,
    length: 90,
  },
  reflector: {
    label: 'Reflector Panel',
    angle: 120,
    intensity: 0,
    reflectivity: 70,
    length: 110,
  },
  screen: {
    label: 'Projection Screen',
    angle: 0,
    intensity: 0,
    reflectivity: 0,
    length: 90,
  },
};

let devices = [];
let selectedDeviceId = null;
let draggingId = null;
let dragOffset = { x: 0, y: 0 };
let deviceIdCounter = 1;

const colors = {
  laser: getCss('--laser'),
  mirror: getCss('--mirror'),
  reflector: getCss('--reflector'),
  screen: getCss('--screen'),
};

function getCss(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

function getMeshSize() {
  return Number.parseInt(meshSizeInput.value, 10);
}

function snap(value) {
  if (!snapToggle.checked) {
    return value;
  }
  const spacing = getMeshSize();
  return Math.round(value / spacing) * spacing;
}

function setCanvasSize() {
  const wrapper = canvas.parentElement;
  const width = wrapper.clientWidth;
  const height = 600;
  canvas.width = width;
  canvas.height = height;
}

function createDevice(type, x, y) {
  const base = deviceDefaults[type];
  return {
    id: deviceIdCounter++,
    type,
    label: base.label,
    x: snap(x),
    y: snap(y),
    angle: base.angle,
    intensity: base.intensity,
    reflectivity: base.reflectivity,
    length: base.length,
  };
}

function getDeviceById(id) {
  return devices.find((device) => device.id === id);
}

function getDeviceSegment(device) {
  const radians = toRadians(device.angle);
  const half = device.length / 2;
  const dx = Math.cos(radians) * half;
  const dy = Math.sin(radians) * half;
  return {
    a: { x: device.x - dx, y: device.y - dy },
    b: { x: device.x + dx, y: device.y + dy },
  };
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function drawMesh() {
  const spacing = getMeshSize();
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDevice(device) {
  ctx.save();
  if (device.type === 'laser') {
    ctx.fillStyle = colors.laser;
    ctx.beginPath();
    ctx.arc(device.x, device.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colors.laser;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const direction = toRadians(device.angle);
    ctx.moveTo(device.x, device.y);
    ctx.lineTo(device.x + Math.cos(direction) * 24, device.y + Math.sin(direction) * 24);
    ctx.stroke();
  } else if (device.type === 'mirror' || device.type === 'reflector') {
    const segment = getDeviceSegment(device);
    ctx.strokeStyle = colors[device.type];
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(segment.a.x, segment.a.y);
    ctx.lineTo(segment.b.x, segment.b.y);
    ctx.stroke();
  } else if (device.type === 'screen') {
    ctx.fillStyle = colors.screen;
    ctx.fillRect(device.x - 30, device.y - 8, 60, 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.strokeRect(device.x - 30, device.y - 8, 60, 16);
  }

  if (device.id === selectedDeviceId) {
    ctx.strokeStyle = 'rgba(109, 76, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(device.x, device.y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function raySegmentIntersection(origin, direction, a, b) {
  const r = direction;
  const s = { x: b.x - a.x, y: b.y - a.y };
  const rxs = cross(r, s);
  if (Math.abs(rxs) < 0.00001) {
    return null;
  }
  const qp = { x: a.x - origin.x, y: a.y - origin.y };
  const t = cross(qp, s) / rxs;
  const u = cross(qp, r) / rxs;
  if (t >= 0 && u >= 0 && u <= 1) {
    return { t, point: { x: origin.x + t * r.x, y: origin.y + t * r.y } };
  }
  return null;
}

function rayBoundsIntersection(origin, direction) {
  const candidates = [];
  if (direction.x !== 0) {
    candidates.push((0 - origin.x) / direction.x);
    candidates.push((canvas.width - origin.x) / direction.x);
  }
  if (direction.y !== 0) {
    candidates.push((0 - origin.y) / direction.y);
    candidates.push((canvas.height - origin.y) / direction.y);
  }
  const valid = candidates.filter((t) => t > 0);
  const t = Math.min(...valid);
  if (!Number.isFinite(t)) {
    return null;
  }
  return { x: origin.x + direction.x * t, y: origin.y + direction.y * t };
}

function reflect(direction, mirrorAngle) {
  const radians = toRadians(mirrorAngle);
  const mirrorDir = { x: Math.cos(radians), y: Math.sin(radians) };
  const normal = { x: -mirrorDir.y, y: mirrorDir.x };
  const dot = direction.x * normal.x + direction.y * normal.y;
  return {
    x: direction.x - 2 * dot * normal.x,
    y: direction.y - 2 * dot * normal.y,
  };
}

function drawBeams() {
  let totalSegments = 0;
  let totalLength = 0;
  const lasers = devices.filter((device) => device.type === 'laser');

  lasers.forEach((laser) => {
    let origin = { x: laser.x, y: laser.y };
    let direction = {
      x: Math.cos(toRadians(laser.angle)),
      y: Math.sin(toRadians(laser.angle)),
    };
    let intensity = laser.intensity / 100;
    let bounces = 0;

    while (bounces < 6 && intensity > 0.05) {
      let nearest = null;
      let hitDevice = null;

      devices.forEach((device) => {
        if (device.id === laser.id || device.type === 'laser') {
          return;
        }
        if (device.type === 'mirror' || device.type === 'reflector') {
          const segment = getDeviceSegment(device);
          const hit = raySegmentIntersection(origin, direction, segment.a, segment.b);
          if (hit && (!nearest || hit.t < nearest.t)) {
            nearest = hit;
            hitDevice = device;
          }
        }
        if (device.type === 'screen') {
          const a = { x: device.x - 30, y: device.y - 8 };
          const b = { x: device.x + 30, y: device.y - 8 };
          const c = { x: device.x + 30, y: device.y + 8 };
          const d = { x: device.x - 30, y: device.y + 8 };
          const edges = [
            [a, b],
            [b, c],
            [c, d],
            [d, a],
          ];
          edges.forEach(([p1, p2]) => {
            const hit = raySegmentIntersection(origin, direction, p1, p2);
            if (hit && (!nearest || hit.t < nearest.t)) {
              nearest = hit;
              hitDevice = device;
            }
          });
        }
      });

      const boundary = rayBoundsIntersection(origin, direction);
      let endPoint = boundary;
      if (nearest && boundary) {
        endPoint = nearest.point;
      }

      if (!endPoint) {
        break;
      }

      ctx.save();
      ctx.strokeStyle = `rgba(255, 77, 103, ${Math.max(0.15, intensity)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
      ctx.restore();

      totalSegments += 1;
      totalLength += Math.hypot(endPoint.x - origin.x, endPoint.y - origin.y);

      if (!nearest || !hitDevice) {
        break;
      }
      if (hitDevice.type === 'screen') {
        break;
      }

      intensity *= hitDevice.reflectivity / 100;
      direction = reflect(direction, hitDevice.angle);
      origin = {
        x: endPoint.x + direction.x * 0.5,
        y: endPoint.y + direction.y * 0.5,
      };
      bounces += 1;
    }
  });

  return { totalSegments, totalLength };
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMesh();
  const summary = drawBeams();
  devices.forEach(drawDevice);
  projectionSummary.textContent = `Devices: ${devices.length} · Segments: ${summary.totalSegments} · Path: ${Math.round(
    summary.totalLength,
  )} px`;
}

function hitTest(device, point) {
  if (device.type === 'laser') {
    return Math.hypot(point.x - device.x, point.y - device.y) < 12;
  }
  if (device.type === 'mirror' || device.type === 'reflector') {
    const segment = getDeviceSegment(device);
    return distanceToSegment(point, segment.a, segment.b) < 10;
  }
  if (device.type === 'screen') {
    return (
      point.x >= device.x - 30 &&
      point.x <= device.x + 30 &&
      point.y >= device.y - 12 &&
      point.y <= device.y + 12
    );
  }
  return false;
}

function distanceToSegment(point, a, b) {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: point.x - a.x, y: point.y - a.y };
  const abLength = ab.x * ab.x + ab.y * ab.y;
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / abLength));
  const closest = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function selectDevice(id) {
  selectedDeviceId = id;
  const device = getDeviceById(id);
  if (!device) {
    deviceForm.hidden = true;
    selectionPrompt.hidden = false;
    drawScene();
    updateDeviceList();
    return;
  }

  deviceForm.hidden = false;
  selectionPrompt.hidden = true;
  deviceName.value = device.label;
  posX.value = Math.round(device.x);
  posY.value = Math.round(device.y);
  angleInput.value = device.angle;
  intensityInput.value = device.intensity ?? 0;
  reflectivityInput.value = device.reflectivity ?? 0;
  segmentLengthInput.value = device.length ?? 80;

  const showIntensity = device.type === 'laser';
  const showReflect = device.type === 'mirror' || device.type === 'reflector';
  const showLength = device.type === 'mirror' || device.type === 'reflector';
  intensityInput.closest('.form-group').style.display = showIntensity ? 'flex' : 'none';
  reflectivityInput.closest('.form-group').style.display = showReflect ? 'flex' : 'none';
  segmentLengthInput.closest('.form-group').style.display = showLength ? 'flex' : 'none';

  drawScene();
  updateDeviceList();
}

function updateDeviceList() {
  deviceList.innerHTML = '';
  if (devices.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No devices on the mesh yet.';
    deviceList.appendChild(empty);
    return;
  }
  devices.forEach((device) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'device-pill';
    pill.textContent = `${device.label} #${device.id}`;
    if (device.id === selectedDeviceId) {
      pill.style.borderColor = 'var(--accent)';
    }
    pill.addEventListener('click', () => selectDevice(device.id));
    deviceList.appendChild(pill);
  });
}

function updateSelectedDevice(updateFn) {
  const device = getDeviceById(selectedDeviceId);
  if (!device) {
    return;
  }
  updateFn(device);
  drawScene();
  updateDeviceList();
}

canvas.addEventListener('mousedown', (event) => {
  const point = getCanvasPoint(event);
  const target = [...devices].reverse().find((device) => hitTest(device, point));
  if (target) {
    draggingId = target.id;
    dragOffset = { x: target.x - point.x, y: target.y - point.y };
    selectDevice(target.id);
  } else {
    selectDevice(null);
  }
});

canvas.addEventListener('mousemove', (event) => {
  if (!draggingId) {
    return;
  }
  const point = getCanvasPoint(event);
  updateSelectedDevice((device) => {
    device.x = snap(point.x + dragOffset.x);
    device.y = snap(point.y + dragOffset.y);
    posX.value = Math.round(device.x);
    posY.value = Math.round(device.y);
  });
});

canvas.addEventListener('mouseup', () => {
  draggingId = null;
});

canvas.addEventListener('mouseleave', () => {
  draggingId = null;
});

canvas.addEventListener('click', (event) => {
  const point = getCanvasPoint(event);
  const target = [...devices].reverse().find((device) => hitTest(device, point));
  if (target) {
    selectDevice(target.id);
  }
});

canvas.parentElement.addEventListener('dragover', (event) => {
  event.preventDefault();
});

canvas.parentElement.addEventListener('drop', (event) => {
  event.preventDefault();
  const type = event.dataTransfer.getData('text/plain');
  if (!deviceDefaults[type]) {
    return;
  }
  const point = getCanvasPoint(event);
  const device = createDevice(type, point.x, point.y);
  devices = [...devices, device];
  selectDevice(device.id);
  updateDeviceList();
});

window.addEventListener('resize', () => {
  setCanvasSize();
  drawScene();
});

meshSizeInput.addEventListener('input', () => {
  drawScene();
});

snapToggle.addEventListener('change', () => {
  drawScene();
});

resetBtn.addEventListener('click', () => {
  devices = [];
  selectDevice(null);
  updateDeviceList();
});

[posX, posY].forEach((input) => {
  input.addEventListener('input', () => {
    const value = Number.parseFloat(input.value);
    if (!Number.isFinite(value)) {
      return;
    }
    updateSelectedDevice((device) => {
      if (input === posX) {
        device.x = snap(value);
      } else {
        device.y = snap(value);
      }
    });
  });
});

angleInput.addEventListener('input', () => {
  const value = Number.parseFloat(angleInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  updateSelectedDevice((device) => {
    device.angle = value;
  });
});

intensityInput.addEventListener('input', () => {
  const value = Number.parseFloat(intensityInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  updateSelectedDevice((device) => {
    device.intensity = value;
  });
});

reflectivityInput.addEventListener('input', () => {
  const value = Number.parseFloat(reflectivityInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  updateSelectedDevice((device) => {
    device.reflectivity = value;
  });
});

segmentLengthInput.addEventListener('input', () => {
  const value = Number.parseFloat(segmentLengthInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  updateSelectedDevice((device) => {
    device.length = value;
  });
});

deviceButtons.forEach((button) => {
  button.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', button.dataset.type);
  });
});

setCanvasSize();
updateDeviceList();
selectDevice(null);
drawScene();
