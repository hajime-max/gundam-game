'use strict';
// Geometry is shared by drawing, shots, turrets and all moving suits.
window.groundStage = (() => {
  const zones = ['基地入口', '補給倉庫群', '岩山・崖', '峡谷突破', '基地中枢'];
  function kind(wx) { return wx >= 3900 && wx < 7600 ? 'rock' : 'building'; }
  function boundary(wx, top, floor) {
    if (wx < 350 || wx > 9900) return top ? 0 : floor;
    const fade = Math.min(1, (wx - 350) / 350, (9900 - wx) / 450);
    let depth;
    if (kind(wx) === 'rock') {
      depth = 88 + 29 * Math.sin(wx / 310 + (top ? 1 : 3)) + 16 * Math.sin(wx / 107) + 7 * Math.sin(wx / 33);
    } else {
      const phase = ((wx + (top ? 0 : 390)) % 920) / 920;
      const rise = Math.max(0, Math.min(1, (phase - .22) / .035, (.66 - phase) / .035));
      depth = 62 + 82 * rise;
    }
    depth *= fade;
    return top ? depth : floor - depth;
  }
  function path(ctx, w, floor, scroll, top) {
    ctx.beginPath(); ctx.moveTo(0, top ? 0 : floor);
    for (let x = 0; x <= w; x += 4) ctx.lineTo(x, boundary(scroll + x, top, floor));
    ctx.lineTo(w, top ? 0 : floor); ctx.closePath();
  }
  function terrain(ctx, w, floor, scroll, top) {
    ctx.save(); path(ctx, w, floor, scroll, top); ctx.clip();
    ctx.fillStyle = '#545c52'; ctx.fillRect(0, 0, w, floor);
    for (let wx = Math.floor(scroll / 80) * 80; wx < scroll + w + 80; wx += 80) {
      const x = wx - scroll, rock = kind(wx) === 'rock';
      ctx.fillStyle = rock ? '#6a6554' : '#737c72'; ctx.fillRect(x, 0, 80, floor);
      const edge = boundary(wx + 40, top, floor);
      const y = top ? edge - 42 : edge + 12;
      if (rock) {
        ctx.fillStyle = '#494b40'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 24, y - 38); ctx.lineTo(x + 68, y + 18); ctx.lineTo(x + 80, top ? 0 : floor); ctx.lineTo(x, top ? 0 : floor); ctx.fill();
        ctx.strokeStyle = '#9c9176'; ctx.beginPath(); ctx.moveTo(x + 10, y - 18); ctx.lineTo(x + 26, y - 27); ctx.lineTo(x + 61, y + 3); ctx.stroke();
      } else {
        ctx.fillStyle = '#91998b'; ctx.fillRect(x + 2, top ? 0 : edge + 5, 76, top ? Math.max(0, edge - 45) : 32);
        ctx.fillStyle = '#303d38'; ctx.fillRect(x + 12, y, 56, 30);
        ctx.strokeStyle = '#58665c'; for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(x + 12, y + j * 6); ctx.lineTo(x + 68, y + j * 6); ctx.stroke(); }
        ctx.fillStyle = '#c3b479'; ctx.fillRect(x + 9, y, 3, 30); ctx.fillRect(x + 68, y, 3, 30);
        ctx.fillStyle = '#3e4943'; ctx.fillRect(x + 33, top ? 9 : edge + 14, 22, 9);
      }
    }
    ctx.restore();
    // Draw only the playable boundary, without a false border at the viewport edge.
    ctx.beginPath(); for (let x = 0; x <= w; x += 4) { const y = boundary(scroll + x, top, floor); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.strokeStyle = '#253b30'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#d0c49a'; ctx.lineWidth = 2; ctx.stroke();
  }
  function background(ctx, im, w, h, scroll) {
    ctx.save(); ctx.imageSmoothingEnabled = true;
    const width = h * im.width / im.height, offset = ((scroll % width) + width) % width;
    ctx.drawImage(im, -offset, 0, width, h); ctx.drawImage(im, width - offset, 0, width, h);
    // Feather the wrap seam instead of exposing a hard texture join.
    const seam = width - offset;
    if (seam < w) {
      const g = ctx.createLinearGradient(seam - 24, 0, seam + 24, 0);
      g.addColorStop(0, '#8a896000'); g.addColorStop(.5, '#8a89605a'); g.addColorStop(1, '#8a896000');
      ctx.fillStyle = g; ctx.fillRect(seam - 24, 0, 48, h);
    }
    ctx.fillStyle = '#40513422'; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  return { boundary, terrain, background, zone: time => zones[Math.min(4, Math.floor(time / 18))] };
})();
