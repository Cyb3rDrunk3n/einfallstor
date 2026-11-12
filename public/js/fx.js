// Bewegte Elemente: Netz im Hintergrund, Tipp-Effekt, Einblenden, Zähler, Funken.
// Alles respektiert die Systemeinstellung "Bewegung reduzieren".

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Zeichnet ein langsam treibendes Netz aus Punkten und Linien auf die Leinwand. */
export function startNetwork(canvas) {
  const context = canvas.getContext('2d');
  const LINK = 150;
  const pointer = { x: -9999, y: -9999 };
  let width = 0;
  let height = 0;
  let nodes = [];
  let frame = 0;

  function draw() {
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < LINK) {
          context.strokeStyle = `rgba(61,255,162,${(1 - distance / LINK) * 0.28})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
      const toPointer = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (toPointer < 190) {
        context.strokeStyle = `rgba(56,217,255,${(1 - toPointer / 190) * 0.5})`;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
      context.fillStyle = 'rgba(150,255,210,.85)';
      context.beginPath();
      context.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      context.fill();
    }
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(85, Math.round((width * height) / 17000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.3 + 0.7,
    }));
    draw();
  }

  function tick() {
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }
    draw();
    frame = requestAnimationFrame(tick);
  }

  function setRunning(running) {
    cancelAnimationFrame(frame);
    if (running && !reduceMotion()) frame = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
  resize();
  setRunning(true);
}

/**
 * Schreibt Zeilen wie in einem Terminal. Zeilen vom Typ "cmd" werden getippt,
 * alle anderen erscheinen am Stück. Gibt eine Funktion zum Abbrechen zurück.
 */
export function typeLines(target, lines) {
  const timers = new Set();
  let cancelled = false;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';

  const wait = (ms) =>
    new Promise((resolve) => {
      const id = setTimeout(() => {
        timers.delete(id);
        resolve();
      }, ms);
      timers.add(id);
    });

  function addRow(type) {
    const row = document.createElement('div');
    row.className = 'tl';
    const prefix = { cmd: ['c-prompt', '$ '], ok: ['c-ok', '[+] '] }[type];
    if (prefix) {
      const mark = document.createElement('span');
      mark.className = prefix[0];
      mark.textContent = prefix[1];
      row.append(mark);
    }
    const text = document.createElement('span');
    if (type === 'out') text.className = 'c-dim';
    row.append(text);
    target.append(row);
    return text;
  }

  async function run() {
    const animate = !reduceMotion();
    for (const line of lines) {
      if (cancelled) return;
      const text = addRow(line.type);
      if (line.type === 'cmd' && animate) {
        text.after(cursor);
        await wait(420);
        for (const char of line.text) {
          if (cancelled) return;
          text.textContent += char;
          await wait(34 + Math.random() * 46);
        }
        await wait(300);
      } else {
        text.textContent = line.text;
        if (animate) await wait(190);
      }
    }
    addRow('cmd').after(cursor);
  }

  run();
  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}

/** Blendet Elemente mit der Klasse "reveal" ein, sobald sie ins Bild kommen. */
export function observeReveal(root) {
  const items = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('in'));
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.1 },
  );
  items.forEach((item) => {
    if (item.dataset.delay) item.style.transitionDelay = `${Number(item.dataset.delay) * 70}ms`;
    observer.observe(item);
  });
  return () => observer.disconnect();
}

/** Zählt ein Element von 0 bis zu seinem data-count hoch, sobald es sichtbar wird. */
export function countUp(element) {
  const goal = Number(element.dataset.count);
  if (reduceMotion() || !('IntersectionObserver' in window)) {
    element.textContent = goal;
    return () => {};
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / 1100);
      element.textContent = Math.round(goal * (1 - (1 - progress) ** 3));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  observer.observe(element);
  return () => observer.disconnect();
}

/** Kleiner Funkenregen als Belohnung, ausgehend vom Punkt (x, y) im Fenster. */
export function burst(x, y) {
  if (reduceMotion()) return;
  const colors = ['#3dffa2', '#38d9ff', '#a48bff', '#ffc95c'];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 60 + Math.random() * 120;
    spark.className = 'spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.background = colors[i % colors.length];
    spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    spark.addEventListener('animationend', () => spark.remove());
    document.body.append(spark);
  }
}
