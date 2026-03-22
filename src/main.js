window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const scene = new GameScene(canvas);

  let lastTime = performance.now();

  function loop(ts) {
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;
    scene.update(dt);
    scene.draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
