// Everything here is an enhancement: the pages read fine without it.
(function () {
  // ---------- progress, shared by every page ----------
  // Each guide remembers its ticked steps under its own path. A summary of
  // [done, total] per case is kept beside them so the desk can read it
  // without opening every guide.
  var SUMMARY = "noir-handson:cases";

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) { return {}; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // If the 3D desk has not come up after a while (script blocked, no WebGL),
  // show the plain list of cases instead of an empty desk.
  var lobby = document.getElementById("lobby");
  if (lobby) {
    setTimeout(function () {
      if (!lobby.classList.contains("is-3d")) lobby.classList.add("is-flat");
    }, 9000);
  }

  // ---------- guide pages ----------
  var prose = document.querySelector(".prose");
  if (!prose) return;

  // The other folders under the open one carry the same stamps as the desk.
  var summary = read(SUMMARY);
  document.querySelectorAll(".others .case").forEach(function (li) {
    var p = summary[li.getAttribute("data-case")];
    if (!p || !p[0]) return;
    var closed = p[0] >= p[1];
    li.querySelector(".case__open").textContent = closed ? "다시 보기" : "이어서 하기";
    var stamp = document.createElement("span");
    stamp.className = "stamp case__state";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = closed ? "사건 종결" : "수사 중 " + p[0] + "/" + p[1];
    li.querySelector(".case__link").appendChild(stamp);
  });

  // Tables scroll inside their own box instead of widening the page. Each
  // cell also carries its column's heading, so a phone can stack the row.
  prose.querySelectorAll("table").forEach(function (table) {
    var heads = Array.prototype.map.call(table.querySelectorAll("th"), function (th) { return th.textContent; });
    table.querySelectorAll("td").forEach(function (td) {
      if (td.cellIndex) td.setAttribute("data-label", heads[td.cellIndex] || "");
    });
    var box = document.createElement("div");
    box.className = "table-scroll";
    table.parentNode.insertBefore(box, table);
    box.appendChild(table);
  });

  // Copy button on every code block.
  prose.querySelectorAll("pre").forEach(function (pre) {
    var box = document.createElement("div");
    box.className = "codeblock";
    pre.parentNode.insertBefore(box, pre);
    box.appendChild(pre);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "복사";
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        btn.textContent = "복사했어요";
        setTimeout(function () { btn.textContent = "복사"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
    box.appendChild(btn);
  });

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }
  function slug(node, fallback) {
    if (!node.id) node.id = fallback;
    return node.id;
  }

  // Contents: the sections of the page, on the slip beside the sheet.
  var toc = [];
  var nav = document.getElementById("page-nav");
  var sections = prose.querySelectorAll(":scope > h2");
  if (nav && sections.length) {
    var list = el("ol");
    sections.forEach(function (h, i) {
      var a = el("a", "", h.textContent);
      a.href = "#" + slug(h, "s-" + i);
      list.appendChild(el("li")).appendChild(a);
      toc.push({ el: h, a: a });
    });
    nav.appendChild(list);
    document.getElementById("page-toc").hidden = false;
  }

  // Steps. Each heading and what follows it becomes one section, so a step
  // can carry its own rail, stamp and tick. Ticks are remembered per page.
  var storeKey = "noir-handson" + location.pathname;
  var caseId = location.pathname.replace(/\/+$/, "").split("/").pop();
  var saved = read(storeKey);
  var steps = Array.prototype.map.call(prose.querySelectorAll(".steps > h3"), function (h, i) {
    var box = el("section", "step");
    h.parentNode.insertBefore(box, h);
    var node = h;
    while (node && (node === h || node.nodeName !== "H3")) {
      var next = node.nextSibling;
      box.appendChild(node);
      node = next;
    }
    slug(h, "step-" + (i + 1));
    return { box: box, head: h };
  });

  // The track: one numbered box per step, between the cover and the text.
  // It stays at the top of the screen while the page scrolls under it.
  var track = null;
  var count = null;
  if (steps.length) {
    track = el("nav", "track");
    track.setAttribute("aria-label", "단계");
    var row = el("ol");
    steps.forEach(function (step, i) {
      var a = el("a");
      a.href = "#" + step.head.id;
      a.appendChild(el("span", "track__n", String(i + 1)));
      a.appendChild(el("span", "track__name", step.head.textContent));
      step.item = row.appendChild(el("li"));
      step.item.appendChild(a);
    });
    track.appendChild(row);
    count = track.appendChild(el("p", "track__count"));

    var doc = document.querySelector(".doc");
    var edge = el("div", "track__edge");
    doc.parentNode.insertBefore(edge, doc);
    doc.parentNode.insertBefore(track, doc);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        track.classList.toggle("is-stuck", !e.isIntersecting && e.boundingClientRect.top < 0);
      }).observe(edge);
    }
  }

  function countDone() {
    var done = 0;
    steps.forEach(function (step, i) { if (saved[i]) done++; });
    return done;
  }

  // Where the reader is: the section, and the step, that has reached the top
  // of the screen. Outside the steps the track points at the next one to do.
  var currentLink = null;
  var currentStep = -1;
  function mark() {
    var link = null;
    for (var i = 0; i < toc.length; i++) {
      if (toc[i].el.getBoundingClientRect().top <= 160) link = toc[i].a;
    }
    if (link !== currentLink) {
      if (currentLink) currentLink.classList.remove("is-current");
      if (link) link.classList.add("is-current");
      currentLink = link;
    }

    var at = -1;
    var next = -1;
    steps.forEach(function (step, i) {
      var r = step.box.getBoundingClientRect();
      if (r.top <= 180 && r.bottom > 180) at = i;
      if (next < 0 && !saved[i]) next = i;
    });
    if (at < 0) at = next;
    if (at !== currentStep) {
      steps.forEach(function (step, i) {
        step.item.classList.toggle("is-current", i === at);
        if (i === at) step.item.firstChild.setAttribute("aria-current", "step");
        else step.item.firstChild.removeAttribute("aria-current");
      });
      currentStep = at;
    }
  }

  var state = document.getElementById("case-state");
  function render() {
    var done = countDone();
    steps.forEach(function (step, i) {
      var on = !!saved[i];
      step.box.classList.toggle("is-done", on);
      step.item.classList.toggle("is-done", on);
    });
    if (!steps.length) return;

    count.textContent = done + " / " + steps.length;
    // The cover carries the same stamp as this folder does on the desk.
    if (state) {
      state.hidden = !done;
      state.textContent = done === steps.length ? "사건 종결" : "수사 중 " + done + "/" + steps.length;
    }
    var sum = read(SUMMARY);
    sum[caseId] = [done, steps.length];
    write(SUMMARY, sum);
  }

  // Ticking the last step closes the case.
  function finish() {
    var finale = document.getElementById("finale");
    if (finale && finale.showModal) finale.showModal();
  }

  steps.forEach(function (step, i) {
    var h = step.head;
    var title = el("span", "step-title");
    while (h.firstChild) title.appendChild(h.firstChild);
    h.appendChild(title);

    // The stamp only animates when the person has just ticked the box, not
    // when a remembered tick is restored on load.
    var stamp = h.appendChild(el("span", "stamp step-stamp", "완료"));
    stamp.setAttribute("aria-hidden", "true");

    // The tick sits at the end of the step, where the work is finished.
    var label = el("label", "step-done");
    var box = el("input");
    box.type = "checkbox";
    box.id = "step-done-" + (i + 1);
    box.checked = !!saved[i];
    box.addEventListener("change", function () {
      var wasAll = countDone() === steps.length;
      saved[i] = box.checked;
      write(storeKey, saved);
      stamp.classList.toggle("is-fresh", box.checked);
      render();
      currentStep = -2;
      mark();
      if (!wasAll && countDone() === steps.length) finish();
    });
    label.appendChild(box);
    label.appendChild(document.createTextNode((i + 1) + "단계 끝냈어요"));
    step.box.appendChild(el("p", "step__end")).appendChild(label);
  });

  render();
  window.addEventListener("scroll", mark, { passive: true });
  window.addEventListener("resize", mark);
  mark();
})();
