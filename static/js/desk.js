// The desk on the first screen: four case folders under a lamp.
//
// The page works without this file. The list of cases in the markup is the
// real navigation; this draws the same four as folders, keeps the picked one
// in step with the list, and plays the folder opening before following the
// link. If WebGL is missing, the list is shown as plain cards instead.
import * as THREE from "./vendor/three.module.min.js";

const lobby = document.getElementById("lobby");
if (lobby) start().catch(function () { lobby.classList.add("is-flat"); });

async function start() {
  const canvas = lobby.querySelector("canvas");
  const stage = document.getElementById("stage");
  const paper = document.getElementById("lobby-paper");
  const items = Array.from(lobby.querySelectorAll(".case"));
  const links = items.map((li) => li.querySelector("a"));
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const aniso = renderer.capabilities.getMaxAnisotropy();

  // ---------- what each folder says ----------

  const W = 2.3, H = 3.1;
  const INK = "#1b1a15";
  const MONO = '"JetBrains Mono", "Nanum Gothic Coding", ui-monospace, monospace';
  const SERIF = 'Hahmlet, "Noto Serif KR", serif';

  const data = items.map(function (li) {
    const name = li.querySelector(".case__name").firstChild.textContent.trim();
    const cut = name.lastIndexOf(" ");
    const cells = Array.from(li.querySelectorAll(".case__meta > div")).map((d) => [
      d.querySelector("dt").textContent.trim(), d.querySelector("dd").textContent.trim(),
    ]);
    return {
      id: li.dataset.case, pose: li.dataset.pose, tab: li.dataset.tab, mark: li.dataset.mark || "",
      lines: [name.slice(0, cut), name.slice(cut + 1)], cells: cells.slice(0, 2),
    };
  });

  function progress() {
    try { return JSON.parse(localStorage.getItem("noir-handson:cases") || "{}") || {}; } catch (e) { return {}; }
  }

  // Text is drawn into textures, so the web fonts have to be there first. A
  // slow network gets the fallback faces after a short wait instead of a
  // blank desk.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const glyphs = data.map((d) => d.lines.join("") + d.tab + d.mark + d.cells.join("")).join("") + "사건종결수사중파일";
  await Promise.race([
    Promise.all([
      document.fonts.load("800 64px Hahmlet", glyphs),
      document.fonts.load('700 24px "Nanum Gothic Coding"', "사건 파일 참가자 핸즈온 토 기여" + glyphs),
      document.fonts.load('700 24px "JetBrains Mono"', "owasp-korea-day GET 0123456789"),
      document.fonts.load('500 24px "JetBrains Mono"', "owasp-korea-day GET 0123456789"),
    ]),
    wait(2500),
  ]).catch(function () {});

  const image = (src) => new Promise(function (res) {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
  const asset = (p) => new URL("../images/" + p, import.meta.url).href;
  const [photos, logo] = await Promise.all([
    Promise.all(data.map((d) => image(asset("mascot/hak-" + d.pose + ".webp")))),
    image(asset("logo-s.png")),
  ]);

  // ---------- drawing helpers ----------

  function tex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  function box(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function fibres(g, w, h, n) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = Math.random() < 0.5 ? "rgba(120,95,40," + rnd(0.03, 0.09) + ")" : "rgba(255,250,225," + rnd(0.04, 0.1) + ")";
      g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 5), 1);
    }
  }

  // A rubber stamp: red ink, double frame, a little worn.
  function stamp(g, text, cx, cy, size, rot, paperColor) {
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.font = "800 " + size + "px " + SERIF;
    const pw = g.measureText(text).width + size * 1.0, ph = size * 1.75;
    g.strokeStyle = g.fillStyle = "rgba(226,36,28,0.94)";
    g.lineWidth = size * 0.1;
    box(g, -pw / 2, -ph / 2, pw, ph, size * 0.16); g.stroke();
    g.lineWidth = size * 0.03;
    box(g, -pw / 2 - size * 0.15, -ph / 2 - size * 0.15, pw + size * 0.3, ph + size * 0.3, size * 0.24); g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, 0, size * 0.05);
    g.fillStyle = paperColor;
    for (let i = 0; i < 150; i++) g.fillRect(rnd(-pw / 2 - 8, pw / 2 + 8), rnd(-ph / 2 - 8, ph / 2 + 8), rnd(1, 4), rnd(1, 2));
    g.restore();
  }

  function drawCover(g, w, h, d, state) {
    const manila = "#e3d1a0";
    g.fillStyle = manila; g.fillRect(0, 0, w, h);
    fibres(g, w, h, 3200);
    g.strokeStyle = "rgba(110,86,36,0.28)"; g.lineWidth = 10; g.strokeRect(0, 0, w, h);

    // printed head, top left (the photo is clipped over the top right)
    g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.fillStyle = "#352e1a"; g.font = "700 42px " + MONO; g.fillText("사건 파일", 56, 104);
    g.fillStyle = "#6c6040"; g.font = "500 25px " + MONO; g.fillText("owasp-korea-day", 56, 146);
    g.fillStyle = "#352e1a"; g.fillRect(56, 170, 262, 4); g.fillRect(56, 180, 262, 2);

    // the name, on a white label
    const lx = 54, ly = Math.round(h * 0.435), lw = w - 108, lh = Math.round(h * 0.285);
    g.fillStyle = "rgba(60,45,10,0.18)"; box(g, lx + 5, ly + 6, lw, lh, 8); g.fill();
    g.fillStyle = "#fbf9f1"; box(g, lx, ly, lw, lh, 8); g.fill();
    g.strokeStyle = INK; g.lineWidth = 3; box(g, lx + 12, ly + 12, lw - 24, lh - 24, 3); g.stroke();
    g.fillStyle = "#0c0c0a"; g.textAlign = "center";
    let size = 104;
    g.font = "800 " + size + "px " + SERIF;
    const widest = Math.max(g.measureText(d.lines[0]).width, g.measureText(d.lines[1]).width);
    if (widest > lw - 90) size = Math.floor(size * (lw - 90) / widest);
    g.font = "800 " + size + "px " + SERIF;
    g.fillText(d.lines[0], w / 2, ly + lh * 0.45);
    g.fillText(d.lines[1], w / 2, ly + lh * 0.45 + size * 1.22);

    // typed fields
    g.textAlign = "left";
    let y = Math.round(h * 0.79);
    d.cells.forEach(function (c) {
      g.fillStyle = "#6c6040"; g.font = "500 27px " + MONO; g.fillText(c[0], 56, y);
      g.fillStyle = "#231f12"; g.font = "700 31px " + MONO;
      const room = w - 56 - 262;
      const tw = g.measureText(c[1]).width;
      if (tw > room) g.font = "700 " + Math.floor(31 * room / tw) + "px " + MONO;
      g.fillText(c[1], 262, y);
      g.fillStyle = "rgba(53,46,26,0.45)";
      for (let x = 56; x < w - 56; x += 9) g.fillRect(x, y + 16, 4, 2);
      y += 66;
    });

    if (state.closed) stamp(g, "사건 종결", w * 0.62, h * 0.925, 70, -0.14, manila);
    else if (state.done) {
      stamp(g, "수사 중 " + state.done + "/" + state.total, w * 0.64, h * 0.935, 52, -0.1, manila);
    } else if (d.mark) stamp(g, d.mark, w * 0.7, h * 0.935, 58, -0.12, manila);
  }

  function drawPhoto(g, w, h, im) {
    g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
    const m = Math.round(w * 0.065);
    g.fillStyle = "#0a0a0a"; g.fillRect(m, m, w - m * 2, h - m * 2);
    if (im) g.drawImage(im, m + 8, m + 8, w - m * 2 - 16, h - m * 2 - 16);
    g.strokeStyle = "rgba(0,0,0,0.14)"; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }

  function drawTyped(g, w, h) {
    g.fillStyle = "#fbfaf5"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#16150f"; g.fillRect(60, 70, w - 120, 4); g.fillRect(60, 80, w - 120, 1.5);
    g.fillStyle = "rgba(30,28,20,0.5)";
    for (let y = 150; y < h - 80; y += 34) {
      if ((y / 34 | 0) % 7 === 6) continue;
      g.fillRect(60, y, rnd(0.45, 1) * (w - 120), 7);
    }
  }

  // The printout that starts the case: one address came back with no tag.
  function drawPrintout(g, w, h) {
    g.fillStyle = "#f7f5ee"; g.fillRect(0, 0, w, h);
    g.textBaseline = "alphabetic"; g.textAlign = "left";
    const rows = [
      ["#77736a", "$ noir scan ."], null,
      ["#16150f", "GET /kakaoPaySuccess?pg_token="], null,
      ["#16150f", "POST /api/orders"],
      ["#55524a", "  ○ tags: payment"], null,
      ["#16150f", "GET /admin/users"],
      ["#55524a", "  ○ tags: admin"], null,
      ["#16150f", "POST /login"],
      ["#55524a", "  ○ tags: auth"],
    ];
    let y = 92;
    rows.forEach(function (r) {
      if (r) { g.fillStyle = r[0]; g.font = "500 27px " + MONO; g.fillText(r[1], 48, y); }
      y += r ? 40 : 22;
    });
    // red pencil round the one with nothing under it
    g.strokeStyle = "rgba(214,32,24,0.9)"; g.lineWidth = 5; g.lineCap = "round";
    g.beginPath(); g.ellipse(290, 146, 262, 36, -0.02, 0.2, Math.PI * 2 + 0.55); g.stroke();
    g.font = "800 40px " + SERIF; g.fillStyle = "rgba(214,32,24,0.92)";
    g.save(); g.translate(360, 232); g.rotate(-0.07); g.fillText("태그가 없다?", 0, 0); g.restore();
  }

  function drawPass(g, w, h) {
    g.fillStyle = "#070707"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ee2a22"; g.fillRect(0, 0, w, 18);
    if (logo) g.drawImage(logo, 44, 62, 84, 84);
    g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = "700 30px " + MONO; g.fillText("OWASP Korea Day 2026", 150, 100);
    g.fillStyle = "#b9b9b9"; g.font = "500 23px " + MONO; g.fillText("Noir 기여 핸즈온", 150, 138);
    g.fillStyle = "#fff"; g.font = "800 66px " + SERIF; g.fillText("참가자", 44, 262);
    g.fillStyle = "#b9b9b9"; g.font = "500 25px " + MONO; g.fillText("2026.11.28 (토)", 44, 318);
    g.strokeStyle = "#3a3a3a"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  }

  function woodTexture() {
    const t = tex(1024, 1024, function (g, w, h) {
      g.fillStyle = "#3a281b"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1700; i++) {
        const y = rnd(0, h), len = rnd(200, 900), x0 = rnd(0, w);
        g.strokeStyle = Math.random() < 0.5 ? "rgba(160,108,64," + rnd(0.04, 0.13) + ")" : "rgba(6,4,2," + rnd(0.06, 0.16) + ")";
        g.lineWidth = rnd(0.6, 2.4);
        const a = rnd(-7, 7), b = rnd(-7, 7), c = rnd(-3, 3);
        // drawn twice so the grain carries across the tile edge
        [x0, x0 - w].forEach(function (x) {
          g.beginPath(); g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.33, y + a, x + len * 0.66, y + b, x + len, y + c);
          g.stroke();
        });
      }
      for (let k = 0; k < 4; k++) {
        g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, k * 256, w, 3);
        g.fillStyle = "rgba(150,104,62,0.1)"; g.fillRect(0, k * 256 + 3, w, 2);
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 3.2);
    return t;
  }

  // Light through window blinds, used as the pattern of the side light.
  function blindsTexture() {
    const t = tex(256, 256, function (g, w, h) {
      g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 30) {
        const grad = g.createLinearGradient(0, y, 0, y + 17);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.3, "rgba(255,255,255,1)");
        grad.addColorStop(0.7, "rgba(255,255,255,1)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad; g.fillRect(0, y, w, 17);
      }
    });
    t.anisotropy = 1;
    return t;
  }

  // ---------- the scene ----------

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 13, 30);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 80);

  const flat = (geo) => geo.rotateX(-Math.PI / 2);
  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
  // Paper and card are matte. A shiny material washes the print out when the
  // lamp is right above it.
  const matte = (o) => new THREE.MeshLambertMaterial(o);
  function mesh(geo, material, x, y, z, parent) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }

  const desk = mesh(flat(new THREE.PlaneGeometry(60, 44)), mat({ map: woodTexture(), roughness: 0.58 }), 0, 0, -2);
  desk.castShadow = false;

  // lights: a warm lamp that follows the pointer, a soft lamp over the whole
  // desk so every folder can be read, and cold light through the blinds
  const key = new THREE.SpotLight(0xffd3a1, 0, 0, 0.34, 0.8, 1.5);
  key.position.set(0.6, 10, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 6;
  key.shadow.camera.near = 3; key.shadow.camera.far = 26;
  scene.add(key, key.target);

  const room = new THREE.SpotLight(0xffc891, 0, 0, 1.0, 1, 1.4);
  room.position.set(0, 12, 3);
  scene.add(room, room.target);

  const blinds = new THREE.SpotLight(0x9fb9ff, 0, 0, 0.55, 0.6, 1.2);
  blinds.position.set(-15, 8.5, -7);
  blinds.target.position.set(1.5, 0, 0.5);
  blinds.map = blindsTexture();
  blinds.castShadow = true;
  blinds.shadow.mapSize.set(1024, 1024);
  blinds.shadow.bias = -0.0005; blinds.shadow.normalBias = 0.03; blinds.shadow.radius = 4;
  blinds.shadow.camera.near = 4; blinds.shadow.camera.far = 34;
  scene.add(blinds, blinds.target);

  const sky = new THREE.HemisphereLight(0x2a3a58, 0x000000, 0);
  scene.add(sky);

  const POWER = { key: 265, room: 60, blinds: 200, sky: 0.6 };

  // ---------- folders ----------

  function backShape(tabX) {
    const s = new THREE.Shape(), r = 0.05, w = W / 2, h = H / 2, tw = 0.86, th = 0.25, sl = 0.07;
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(tabX + tw, h);
    s.lineTo(tabX + tw - sl, h + th - 0.04); s.quadraticCurveTo(tabX + tw - sl - 0.01, h + th, tabX + tw - sl - 0.05, h + th);
    s.lineTo(tabX + sl + 0.05, h + th); s.quadraticCurveTo(tabX + sl + 0.01, h + th, tabX + sl, h + th - 0.04);
    s.lineTo(tabX, h);
    s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
    return s;
  }
  function frontShape() {
    const s = new THREE.Shape(), r = 0.05, w = W / 2, h = H / 2;
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
    return s;
  }
  // Stretch a shape's own coordinates over the whole texture.
  function coverUV(geo) {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W / 2) / W, (p.getY(i) + H / 2) / H);
    return geo;
  }

  const manilaBack = matte({ color: 0xc9b47c });
  const manilaSide = matte({ color: 0xd8c690 });
  const paperMat = matte({ color: 0xf2efe5 });
  const typedMat = matte({ map: tex(512, 690, drawTyped) });
  const clipMat = mat({ color: 0xc9cdd2, roughness: 0.28, metalness: 0.55 });
  const thin = { depth: 0.016, bevelEnabled: false, curveSegments: 6 };
  const frontBody = flat(new THREE.ExtrudeGeometry(frontShape(), thin));
  const frontFace = flat(coverUV(new THREE.ShapeGeometry(frontShape(), 6)));
  const clipGeo = (function () {
    const pts = [[0.05, 0.03], [0.05, -0.2], [0, -0.255], [-0.05, -0.2], [-0.05, 0.17], [-0.016, 0.21], [0.018, 0.17], [0.018, -0.11]]
      .map((p) => new THREE.Vector3(p[0], 0, p[1]));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.011, 6);
  })();

  const folders = data.map(function (d, i) {
    const g = new THREE.Group();
    scene.add(g);

    const tabX = -W / 2 + 0.14 + i * 0.4;
    mesh(flat(new THREE.ExtrudeGeometry(backShape(tabX), thin)), manilaBack, 0, 0, 0, g);
    const tabLabel = tex(256, 72, function (c, w, h) {
      c.fillStyle = "#fbf9f1"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#14130f"; c.textAlign = "center"; c.textBaseline = "middle";
      c.font = "700 38px " + MONO; c.fillText(d.tab, w / 2, h / 2 + 2);
    });
    const tl = mesh(flat(new THREE.PlaneGeometry(0.62, 0.17)), matte({ map: tabLabel }), tabX + 0.43, 0.0175, -H / 2 - 0.115, g);
    tl.castShadow = false;

    // the papers inside
    mesh(new THREE.BoxGeometry(W - 0.16, 0.012, H - 0.14), paperMat, 0.03, 0.022, 0.02, g).rotation.y = 0.012;
    const top = mesh(flat(new THREE.PlaneGeometry(W - 0.2, H - 0.18)), typedMat, 0.0, 0.031, 0.0, g);
    top.rotation.y = -0.008; top.castShadow = false;

    // the front cover turns on its left edge, like a book
    const hinge = new THREE.Group();
    hinge.position.set(-W / 2, 0.036, 0);
    g.add(hinge);
    mesh(frontBody, manilaSide, W / 2, 0, 0, hinge);
    const faceMat = matte({});
    const face = mesh(frontFace, faceMat, W / 2, 0.0172, 0, hinge);
    face.castShadow = false;

    // Hak's photo, held by a paper clip on the top edge
    const photo = mesh(flat(new THREE.PlaneGeometry(0.98, 0.98)),
      mat({ map: tex(512, 512, (c, w, h) => drawPhoto(c, w, h, photos[i])), roughness: 0.6 }),
      W / 2 + 0.52, 0.0215, -H / 2 + 0.6, hinge);
    photo.rotation.y = [-0.07, 0.05, -0.04, 0.08][i];
    photo.castShadow = false;
    const clip = mesh(clipGeo, clipMat, W / 2 + 0.3, 0.03, -H / 2 + 0.16, hinge);
    clip.rotation.y = 0.12;

    return { g, hinge, faceMat, d, lift: 0, open: 0, openT: 0, x: 0, z: 0, ry: 0 };
  });

  function paintCovers() {
    const p = progress();
    folders.forEach(function (f) {
      const pr = p[f.d.id] || [0, 0];
      const state = { done: pr[0], total: pr[1], closed: pr[1] > 0 && pr[0] >= pr[1] };
      if (f.faceMat.map) f.faceMat.map.dispose();
      f.faceMat.map = tex(768, 1035, (g, w, h) => drawCover(g, w, h, f.d, state));
      f.faceMat.needsUpdate = true;
    });
    // the button says whether this is a start, a return, or a second look
    items.forEach(function (li) {
      const pr = p[li.dataset.case] || [0, 0];
      li.querySelector(".case__open").textContent = !pr[0] ? "사건 열기" : pr[0] >= pr[1] ? "다시 보기" : "이어서 하기";
    });
  }
  paintCovers();

  // ---------- things on the desk ----------

  // the printout and the pass lie flat; they are stacked by height so they
  // never fight over the same pixels
  const printout = mesh(flat(new THREE.PlaneGeometry(2.5, 1.95)), matte({ map: tex(820, 640, drawPrintout) }), 3.5, 0.006, -3.15);
  printout.rotation.y = 0.13; printout.castShadow = false;
  const pass = mesh(flat(new THREE.PlaneGeometry(1.75, 1.1)), mat({ map: tex(700, 440, drawPass), roughness: 0.45 }), 6.4, 0.012, 1.3);
  pass.rotation.y = -0.3; pass.castShadow = false;

  // coffee
  const mug = new THREE.Group();
  mug.position.set(6.3, 0, -3.7);
  scene.add(mug);
  const ceramic = mat({ color: 0xcdc8be, roughness: 0.25 });
  const profile = [[0, 0], [0.4, 0], [0.45, 0.05], [0.45, 0.86], [0.43, 0.9], [0.39, 0.86], [0.39, 0.12], [0, 0.12]].map((p) => new THREE.Vector2(p[0], p[1]));
  mesh(new THREE.LatheGeometry(profile, 40), ceramic, 0, 0, 0, mug);
  mesh(flat(new THREE.CircleGeometry(0.39, 40)), mat({ color: 0x1d0f06, roughness: 0.12 }), 0, 0.76, 0, mug).castShadow = false;
  const handle = mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 24, Math.PI), ceramic, 0.44, 0.47, 0, mug);
  handle.rotation.z = -Math.PI / 2;
  mug.rotation.y = -0.6;

  // magnifying glass
  const glass = new THREE.Group();
  glass.position.set(-6.75, 0, -0.4);
  glass.rotation.y = 0.55;
  scene.add(glass);
  const brass = mat({ color: 0xb98a3c, roughness: 0.3, metalness: 0.55 });
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.055, 12, 56), brass, 0, 0.075, 0, glass);
  ring.rotation.x = Math.PI / 2;
  const lens = mesh(flat(new THREE.CircleGeometry(0.6, 48)), mat({ color: 0xcfe3ff, roughness: 0.05, transparent: true, opacity: 0.1 }), 0, 0.075, 0, glass);
  lens.castShadow = false;
  const ferrule = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), brass, 0.8, 0.085, 0, glass);
  ferrule.rotation.z = Math.PI / 2;
  const grip = mesh(new THREE.CylinderGeometry(0.085, 0.07, 1.15, 16), mat({ color: 0x24150c, roughness: 0.45 }), 1.5, 0.085, 0, glass);
  grip.rotation.z = Math.PI / 2;

  // red pencil
  const pencil = new THREE.Group();
  pencil.position.set(1.55, 0.062, -2.55);
  pencil.rotation.y = -0.32;
  scene.add(pencil);
  const along = (m) => { m.rotation.z = Math.PI / 2; return m; };
  along(mesh(new THREE.CylinderGeometry(0.062, 0.062, 1.9, 6), mat({ color: 0xc81e17, roughness: 0.4 }), 0, 0, 0, pencil));
  along(mesh(new THREE.CylinderGeometry(0.062, 0.012, 0.24, 6), mat({ color: 0xd9bb8c, roughness: 0.8 }), -1.07, 0, 0, pencil));
  along(mesh(new THREE.CylinderGeometry(0.02, 0.002, 0.08, 6), mat({ color: 0x1a1a1a, roughness: 0.4 }), -1.19, 0, 0, pencil));
  along(mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.16, 12), clipMat, 1.03, 0, 0, pencil));
  along(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), mat({ color: 0xe6a59d, roughness: 0.9 }), 1.18, 0, 0, pencil));

  // ink pad and the stamp that goes with it
  const pad = new THREE.Group();
  pad.position.set(6.65, 0, -1.4);
  pad.rotation.y = -0.35;
  scene.add(pad);
  mesh(new THREE.BoxGeometry(1.25, 0.13, 0.85), mat({ color: 0x0b0b0b, roughness: 0.35 }), 0, 0.065, 0, pad);
  mesh(new THREE.BoxGeometry(1.06, 0.02, 0.66), mat({ color: 0xb3140f, roughness: 0.95 }), 0, 0.136, 0, pad);
  const wood = mat({ color: 0x5a3a20, roughness: 0.4 });
  const knob = [[0, 0], [0.2, 0], [0.2, 0.16], [0.09, 0.24], [0.075, 0.52], [0.15, 0.62], [0.17, 0.74], [0.12, 0.84], [0, 0.87]].map((p) => new THREE.Vector2(p[0], p[1]));
  mesh(new THREE.LatheGeometry(knob, 28), wood, -0.2, 0.05, -0.85, pad);
  mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 28), mat({ color: 0x7a0f0b, roughness: 0.9 }), -0.2, 0.025, -0.85, pad);

  // dust in the lamp's beam: each mote is lit only while it is inside the cone
  const MOTES = 260;
  const motePos = new Float32Array(MOTES * 3), moteVel = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) {
    motePos[i * 3] = rnd(-8, 8); motePos[i * 3 + 1] = rnd(0.3, 6); motePos[i * 3 + 2] = rnd(-5, 5);
    moteVel[i * 3] = rnd(-0.06, 0.06); moteVel[i * 3 + 1] = rnd(-0.03, 0.05); moteVel[i * 3 + 2] = rnd(-0.05, 0.05);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uLamp: { value: key.position }, uAt: { value: key.target.position }, uCos: { value: Math.cos(0.3) }, uPower: { value: 0 }, uSize: { value: 60 } },
    vertexShader: "uniform vec3 uLamp; uniform vec3 uAt; uniform float uCos; uniform float uPower; uniform float uSize; varying float vA;" +
      "void main(){ vec3 axis = normalize(uAt - uLamp); float c = dot(axis, normalize(position - uLamp));" +
      "vA = smoothstep(uCos, uCos + 0.03, c) * uPower; vec4 mv = modelViewMatrix * vec4(position, 1.0);" +
      "gl_PointSize = uSize / -mv.z; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "varying float vA; void main(){ float r = length(gl_PointCoord - 0.5);" +
      "gl_FragColor = vec4(1.0, 0.84, 0.62, smoothstep(0.5, 0.05, r) * vA * 0.55); }",
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  // ---------- framing ----------

  const camHome = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), lookNow = new THREE.Vector3();
  const v = new THREE.Vector3();
  const TILT = [0.05, -0.035, 0.03, -0.06];

  // Put the folders in a row, or two by two on a tall screen, then back the
  // camera off until they fill the empty band between the title and the panel.
  function fit() {
    const w = lobby.clientWidth, h = lobby.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const lr = lobby.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const bx = sr.left - lr.left, by = sr.top - lr.top, bw = sr.width, bh = sr.height;
    // a wide band takes the folders in a row; a squarer one, two by two
    const grid = bw / bh < 1.8;
    folders.forEach(function (f, i) {
      if (grid) { f.x = (i % 2 ? 1 : -1) * 1.42; f.z = (i < 2 ? -1 : 1) * 1.95; }
      else { f.x = (i - 1.5) * 2.78; f.z = 0.25 * Math.cos(i * 2.2) ; }
      f.ry = TILT[i];
    });
    // two rows of folders reach back to where the printout lies, under the title
    printout.visible = pencil.visible = !grid;
    const pitch = (grid ? 66 : 53) * Math.PI / 180;
    const dir = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));
    camera.clearViewOffset();

    const measure = function (d) {
      camera.position.copy(dir).multiplyScalar(d);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      folders.forEach(function (f) {
        for (let k = 0; k < 8; k++) {
          v.set(f.x + (k & 1 ? 1 : -1) * W * 0.53, k & 4 ? 0.5 : 0, f.z + (k & 2 ? H * 0.52 : -H * 0.6)).project(camera);
          const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
      });
      return [x0, x1, y0, y1];
    };
    let lo = 3, hi = 70;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2, m = measure(mid);
      if (m[1] - m[0] <= bw && m[3] - m[2] <= bh) hi = mid; else lo = mid;
    }
    const m = measure(hi);
    camera.setViewOffset(w, h, (m[0] + m[1]) / 2 - (bx + bw / 2), (m[2] + m[3]) / 2 - (by + bh / 2), w, h);
    camHome.copy(camera.position);
    if (!ready) { camPos.copy(camHome); lookNow.set(0, 0, 0); }
    scene.fog.near = hi * 0.95; scene.fog.far = hi * 2.3;
    moteMat.uniforms.uSize.value = h * 0.075 * dpr;
  }

  // ---------- picking a case ----------

  let sel = Math.max(0, items.findIndex((li) => li.classList.contains("is-selected")));
  try {
    const kept = parseInt(sessionStorage.getItem("noir-handson:picked"), 10);
    if (kept >= 0 && kept < items.length) sel = kept;
  } catch (e) {}
  const at = document.getElementById("case-at");
  let opening = false, ready = false;

  function select(i) {
    sel = (i + items.length) % items.length;
    items.forEach((li, k) => li.classList.toggle("is-selected", k === sel));
    if (at) at.textContent = (sel + 1) + " / " + items.length;
    try { sessionStorage.setItem("noir-handson:picked", String(sel)); } catch (e) {}
  }

  function open(i) {
    if (opening) return;
    select(i);
    const href = links[sel].href;
    if (calm) { location.href = href; return; }
    opening = true;
    lobby.classList.add("is-opening");
    folders[sel].openT = 1;
    setTimeout(() => paper.classList.add("is-on"), 560);
    setTimeout(() => { location.href = href; }, 940);
  }

  links.forEach(function (a, i) {
    a.addEventListener("focus", () => { pointerLive = false; select(i); });
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      open(i);
    });
  });
  document.getElementById("case-prev").addEventListener("click", () => { pointerLive = false; select(sel - 1); });
  document.getElementById("case-next").addEventListener("click", () => { pointerLive = false; select(sel + 1); });

  window.addEventListener("keydown", function (e) {
    if (!visible || opening || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && el !== document.body && !lobby.contains(el)) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      pointerLive = false;
      select(sel + (e.key === "ArrowLeft" ? -1 : 1));
      e.preventDefault();
    } else if (e.key === "Enter" && (!el || el === document.body)) {
      open(sel);
    }
  });

  // pointer: where it touches the desk drives the lamp, and which folder it
  // is over is the picked one
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
  const hit = new THREE.Vector3(), lampAt = new THREE.Vector3(), lampWant = new THREE.Vector3();
  let pointerLive = false, px = 0, py = 0;

  function folderAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return -1;
    for (let k = 0; k < folders.length; k++) {
      const f = folders[k], dx = hit.x - f.x, dz = hit.z - f.z, c = Math.cos(f.ry), s = Math.sin(f.ry);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < W / 2 + 0.06 && lz > -H / 2 - 0.28 && lz < H / 2 + 0.06) return k;
    }
    return -1;
  }

  lobby.addEventListener("pointermove", function (e) {
    if (opening) return;
    const k = folderAt(e);
    lampWant.set(Math.max(-9, Math.min(9, hit.x)), 0, Math.max(-3.2, Math.min(4.5, hit.z)));
    px = ndc.x; py = ndc.y;
    if (e.pointerType === "mouse") {
      pointerLive = true;
      const over = e.target === canvas && k >= 0;
      canvas.style.cursor = over ? "pointer" : "";
      if (over && k !== sel) select(k);
    }
  });
  lobby.addEventListener("pointerleave", () => { pointerLive = false; px = py = 0; });
  canvas.addEventListener("click", function (e) {
    const k = folderAt(e);
    if (k < 0) return;
    // a mouse is already over the folder it clicks; a finger picks first and
    // opens on the second tap
    if (k === sel) open(k); else { pointerLive = false; select(k); }
  });

  // ---------- running ----------

  const damp = (a, b, k, dt) => calm ? b : a + (b - a) * (1 - Math.exp(-k * dt));
  let visible = true, last = 0, t = 0, born = -1, slow = 0, frames = 0;

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (!visible) return;
    t += dt;
    if (born < 0) born = t;

    // the lamp comes on with a flicker; the window light is there from the start
    const age = t - born;
    let on = 1;
    if (!calm && age < 1.5) {
      on = age < 0.3 ? 0 : age < 0.36 ? 0.75 : age < 0.47 ? 0.06 : age < 0.52 ? 0.9 : age < 0.6 ? 0.25 : Math.min(1, 0.55 + (age - 0.6) * 0.9);
    }
    const breathe = calm ? 1 : 1 + Math.sin(t * 9.1) * 0.006 + Math.sin(t * 23.7) * 0.004;
    key.intensity = POWER.key * on * breathe;
    room.intensity = POWER.room * on;
    blinds.intensity = POWER.blinds;
    sky.intensity = POWER.sky;
    moteMat.uniforms.uPower.value = on;

    // with no mouse on the desk the lamp rests on the picked folder
    const f0 = folders[sel];
    if (!pointerLive) lampWant.set(f0.x, 0, f0.z);
    lampAt.x = damp(lampAt.x, lampWant.x, 5, dt);
    lampAt.z = damp(lampAt.z, lampWant.z, 5, dt);
    key.target.position.set(lampAt.x, 0, lampAt.z);
    key.position.x = 0.6 + lampAt.x * 0.35;

    folders.forEach(function (f, i) {
      f.lift = damp(f.lift, i === sel ? 1 : 0, 11, dt);
      f.open = damp(f.open, f.openT, 5.2, dt);
      const bob = calm || i !== sel ? 0 : Math.sin(t * 1.7) * 0.018;
      f.g.position.set(f.x, f.lift * 0.4 + bob, f.z + f.lift * 0.14);
      f.g.scale.setScalar(1 + f.lift * 0.035);
      f.g.rotation.set(f.lift * 0.17, f.ry * (1 - f.lift * 0.6), 0, "YXZ");
      f.hinge.rotation.z = f.open * 2.7;
    });

    if (!calm) {
      for (let i = 0; i < MOTES * 3; i += 3) {
        motePos[i] += moteVel[i] * dt; motePos[i + 1] += moteVel[i + 1] * dt; motePos[i + 2] += moteVel[i + 2] * dt;
        if (motePos[i + 1] > 6) motePos[i + 1] = 0.3; else if (motePos[i + 1] < 0.3) motePos[i + 1] = 6;
        if (Math.abs(motePos[i]) > 8) moteVel[i] *= -1;
        if (Math.abs(motePos[i + 2]) > 5) moteVel[i + 2] *= -1;
      }
      moteGeo.attributes.position.needsUpdate = true;
    }

    // camera: a little parallax while idle, a dive into the folder when it opens
    if (opening) {
      camPos.x = damp(camPos.x, f0.x + 0.15, 3.6, dt);
      camPos.y = damp(camPos.y, 4.4, 3.6, dt);
      camPos.z = damp(camPos.z, f0.z + 2.3, 3.6, dt);
      camLook.set(f0.x + 0.1, 0.2, f0.z - 0.1);
    } else {
      const k = camHome.length() * 0.028;
      camPos.x = damp(camPos.x, camHome.x + (calm ? 0 : px * k), 2.4, dt);
      camPos.y = damp(camPos.y, camHome.y + (calm ? 0 : py * k * 0.5), 2.4, dt);
      camPos.z = damp(camPos.z, camHome.z, 2.4, dt);
      camLook.set(0, 0, 0);
    }
    lookNow.x = damp(lookNow.x, camLook.x, 4, dt);
    lookNow.y = damp(lookNow.y, camLook.y, 4, dt);
    lookNow.z = damp(lookNow.z, camLook.z, 4, dt);
    camera.position.copy(camPos);
    camera.lookAt(lookNow);

    renderer.render(scene, camera);

    // A machine that cannot keep up gets fewer pixels, once.
    if (dpr > 1 && frames < 90) {
      frames++;
      if (frames > 20 && dt > 0.03) slow++;
      if (frames === 90 && slow > 35) { dpr = 1; renderer.setPixelRatio(1); fit(); }
    }
  }

  fit();
  select(sel);
  lampAt.set(folders[sel].x, 0, folders[sel].z);
  ready = true;
  // the band also changes when the panel under it grows or shrinks
  const sized = new ResizeObserver(fit);
  sized.observe(lobby);
  sized.observe(stage);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(lobby);

  // Coming back with the back button finds the folder closed again, and its
  // cover repainted in case steps were ticked meanwhile.
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    opening = false;
    lobby.classList.remove("is-opening");
    paper.classList.remove("is-on");
    folders.forEach((f) => { f.open = f.openT = 0; });
    camPos.copy(camHome); lookNow.set(0, 0, 0);
    paintCovers();
  });

  renderer.setAnimationLoop(tick);
  document.getElementById("dock-ctl").hidden = false;
  lobby.classList.add("is-3d");
}
