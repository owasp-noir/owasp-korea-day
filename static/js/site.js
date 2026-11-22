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

  // Wide tables scroll inside their own box instead of widening the page.
  prose.querySelectorAll("table").forEach(function (table) {
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

  // Step checkboxes, remembered per page in this browser.
  var steps = Array.prototype.slice.call(prose.querySelectorAll(".steps > h3"));
  var storeKey = "noir-handson" + location.pathname;
  var caseId = location.pathname.replace(/\/+$/, "").split("/").pop();
  var saved = read(storeKey);

  // Side navigation: sections, with the steps nested under their section.
  var nav = document.getElementById("page-nav");
  var progress = document.getElementById("step-progress");
  var links = [];
  var stepLinks = [];

  function slug(el, i) {
    if (!el.id) el.id = "s-" + i;
    return el.id;
  }

  if (nav) {
    var list = document.createElement("ol");
    var sub = null;
    prose.querySelectorAll(":scope > h2, .steps > h3").forEach(function (h, i) {
      var a = document.createElement("a");
      a.href = "#" + slug(h, i);
      a.textContent = h.textContent;
      var li = document.createElement("li");
      li.appendChild(a);
      if (h.tagName === "H2") {
        list.appendChild(li);
        sub = null;
      } else {
        if (!sub) {
          sub = document.createElement("ol");
          (list.lastElementChild || list).appendChild(sub);
        }
        a.textContent = (stepLinks.length + 1) + ". " + h.textContent;
        sub.appendChild(li);
        stepLinks.push(a);
      }
      links.push({ el: h, a: a });
    });
    nav.appendChild(list);

    // The current entry is the last heading that has scrolled past the top.
    var current = null;
    var mark = function () {
      var pick = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].el.getBoundingClientRect().top <= 140) pick = links[i].a;
      }
      if (pick === current) return;
      if (current) current.classList.remove("is-current");
      if (pick) pick.classList.add("is-current");
      current = pick;
    };
    window.addEventListener("scroll", mark, { passive: true });
    mark();
  }

  // The bar along the top of the screen: one segment per step.
  var bar = null;
  if (steps.length) {
    bar = document.createElement("div");
    bar.className = "steps-bar";
    bar.setAttribute("aria-hidden", "true");
    steps.forEach(function () { bar.appendChild(document.createElement("span")); });
    document.body.appendChild(bar);
  }

  function countDone() {
    var done = 0;
    steps.forEach(function (h, i) { if (saved[i]) done++; });
    return done;
  }

  function render() {
    var done = countDone();
    steps.forEach(function (h, i) {
      var on = !!saved[i];
      h.classList.toggle("is-done", on);
      if (stepLinks[i]) stepLinks[i].classList.toggle("is-done", on);
      if (bar) bar.children[i].classList.toggle("is-done", on);
    });
    if (progress && steps.length) {
      progress.hidden = false;
      progress.textContent = done + " / " + steps.length + " 단계 완료";
    }
    // Every step done closes the case.
    var closed = document.getElementById("case-closed");
    if (closed) closed.hidden = !(steps.length && done === steps.length);

    if (steps.length) {
      var sum = read(SUMMARY);
      sum[caseId] = [done, steps.length];
      write(SUMMARY, sum);
    }
  }

  // Ticking the last step closes the case.
  function finish() {
    var finale = document.getElementById("finale");
    if (finale && finale.showModal) finale.showModal();
  }

  steps.forEach(function (h, i) {
    var title = document.createElement("span");
    title.className = "step-title";
    while (h.firstChild) title.appendChild(h.firstChild);
    h.appendChild(title);

    var label = document.createElement("label");
    label.className = "step-done";
    var box = document.createElement("input");
    box.type = "checkbox";
    box.id = "step-done-" + (i + 1);
    box.checked = !!saved[i];
    // The stamp only animates when the person has just ticked the box, not
    // when a remembered tick is restored on load.
    var stamp = document.createElement("span");
    stamp.className = "stamp step-stamp";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = "완료";

    box.addEventListener("change", function () {
      var wasAll = countDone() === steps.length;
      saved[i] = box.checked;
      write(storeKey, saved);
      stamp.classList.toggle("is-fresh", box.checked);
      render();
      if (!wasAll && countDone() === steps.length) finish();
    });
    label.appendChild(box);
    label.appendChild(document.createTextNode("끝냈어요"));
    var group = document.createElement("span");
    group.className = "step-check";
    group.appendChild(stamp);
    group.appendChild(label);
    h.appendChild(group);
  });

  render();
})();
