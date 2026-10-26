/* Unique Automation CCTV — site scripts. Plain JavaScript; Bootstrap's bundle handles the navbar and FAQ. */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "917974378243";
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const formatINR = (n) => inr.format(n);
  const waLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // <a data-wa="message"> becomes a WhatsApp chat link with that message prefilled.
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = waLink(a.dataset.wa);
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  initHeader();
  initReveal();
  initClock();
  initEstimator();
  initContactForm();

  /** Header gets a solid background once scrolled, or while the mobile menu is open. */
  function initHeader() {
    const header = document.getElementById("siteHeader");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const menu = document.getElementById("mainNav");
    if (!menu) return;
    menu.addEventListener("show.bs.collapse", () => header.classList.add("menu-open"));
    menu.addEventListener("hidden.bs.collapse", () => header.classList.remove("menu-open"));
  }

  /** Fades .reveal elements in when they scroll into view. */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => observer.observe(el));
  }

  /** Live timestamp on the hero camera wall. */
  function initClock() {
    const clocks = document.querySelectorAll("[data-clock]");
    if (!clocks.length) return;
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const d = new Date();
      const stamp = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(
        d.getMinutes(),
      )}:${pad(d.getSeconds())}`;
      clocks.forEach((el) => {
        el.textContent = stamp;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /** CCTV cost estimator (#estimator). */
  function initEstimator() {
    const root = document.getElementById("estimator");
    if (!root) return;

    // Indicative market prices — adjust to your own rate card.
    const cameraTypes = {
      hd: { label: "2MP HD", price: 1600, mbps: 1.5, ip: false },
      colour: { label: "2.4MP Colour", price: 2400, mbps: 1.8, ip: false },
      ip4: { label: "4MP IP", price: 3900, mbps: 3, ip: true },
      ip8: { label: "4K IP", price: 7200, mbps: 6, ip: true },
    };
    const recorders = [
      { channels: 4, dvr: 3200, nvr: 4500 },
      { channels: 8, dvr: 4800, nvr: 8500 },
      { channels: 16, dvr: 8500, nvr: 15500 },
      { channels: 32, dvr: 17500, nvr: 26000 },
    ];
    const disks = [
      { tb: 1, price: 4200 },
      { tb: 2, price: 5800 },
      { tb: 4, price: 9200 },
      { tb: 6, price: 13500 },
      { tb: 8, price: 17500 },
    ];
    const INSTALL_PER_CAMERA = 850;
    const addOns = {
      monitor: { label: "22″ monitor display", price: 7000 },
      ups: { label: "UPS power backup", price: 3500 },
    };
    // GB per day for a stream of 1 Mbps recorded 24 hours: 86400 s / 8 / 1000.
    const GB_PER_MBPS_DAY = 10.8;

    const range = root.querySelector("#estCameras");
    const typeButtons = root.querySelectorAll("[data-type]");
    const dayButtons = root.querySelectorAll("[data-days]");
    const addonInputs = root.querySelectorAll("[data-addon]");
    const out = {
      count: root.querySelector("#estCount"),
      low: root.querySelector("#estLow"),
      high: root.querySelector("#estHigh"),
      lines: root.querySelector("#estLines"),
      whatsapp: root.querySelector("#estWhatsapp"),
    };

    const pressed = (buttons) => [...buttons].find((b) => b.getAttribute("aria-pressed") === "true");
    const state = {
      cameras: Number(range.value),
      type: pressed(typeButtons).dataset.type,
      days: Number(pressed(dayButtons).dataset.days),
    };

    function render() {
      const type = cameraTypes[state.type];
      const recorder = recorders.find((r) => r.channels >= state.cameras) || recorders[recorders.length - 1];
      const recorderPrice = type.ip ? recorder.nvr : recorder.dvr;

      const neededTb = (state.cameras * type.mbps * GB_PER_MBPS_DAY * state.days) / 1000;
      const disk = disks.find((d) => d.tb >= neededTb);
      const largest = disks[disks.length - 1];
      const diskCount = disk ? 1 : Math.ceil(neededTb / largest.tb);
      const diskLabel = disk ? `${disk.tb} TB` : `${diskCount} × ${largest.tb} TB`;
      const diskPrice = disk ? disk.price : diskCount * largest.price;

      const lines = [
        { label: `${state.cameras} × ${type.label} camera`, amount: state.cameras * type.price },
        { label: `${recorder.channels}-channel ${type.ip ? "NVR" : "DVR"}`, amount: recorderPrice },
        { label: `${diskLabel} surveillance HDD`, amount: diskPrice },
        { label: "Cabling, accessories & installation", amount: state.cameras * INSTALL_PER_CAMERA },
      ];
      addonInputs.forEach((input) => {
        if (input.checked) lines.push(addOns[input.dataset.addon]);
      });
      const items = lines.map((l) => ({ label: l.label, amount: l.amount ?? l.price }));

      const total = items.reduce((sum, l) => sum + l.amount, 0);
      const round = (n) => Math.round(n / 100) * 100;
      const low = round(total * 0.92);
      const high = round(total * 1.08);

      out.count.textContent = state.cameras;
      out.low.textContent = formatINR(low);
      out.high.textContent = formatINR(high);
      out.lines.replaceChildren(
        ...items.map((l) => {
          const li = document.createElement("li");
          const label = document.createElement("span");
          const amount = document.createElement("span");
          label.textContent = l.label;
          amount.textContent = formatINR(l.amount);
          li.append(label, amount);
          return li;
        }),
      );
      out.whatsapp.href = waLink(`Hi, I used the cost estimator on your website.
Cameras: ${state.cameras} × ${type.label}
Recording: ${state.days} days (${diskLabel})
Estimate: ${formatINR(low)} – ${formatINR(high)}
Please share an exact quote.`);
    }

    function selectButton(buttons, chosen) {
      buttons.forEach((b) => b.setAttribute("aria-pressed", b === chosen ? "true" : "false"));
    }

    range.addEventListener("input", () => {
      state.cameras = Number(range.value);
      render();
    });
    typeButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        state.type = btn.dataset.type;
        selectButton(typeButtons, btn);
        render();
      }),
    );
    dayButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        state.days = Number(btn.dataset.days);
        selectButton(dayButtons, btn);
        render();
      }),
    );
    addonInputs.forEach((input) => input.addEventListener("change", render));

    render();
  }

  /** Contact form: validates in the browser, then posts JSON to contact.php. */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const propertyTypes = ["Home / Flat", "Shop / Showroom", "Office", "Society / RWA", "School / Hospital", "Factory / Warehouse"];
    const fields = ["name", "phone", "location", "propertyType", "cameras", "message"];
    const submitBtn = form.querySelector('[type="submit"]');
    const submitLabel = submitBtn.innerHTML;
    const alertBox = document.getElementById("formAlert");
    const whatsappBtn = document.getElementById("formWhatsapp");
    const success = document.getElementById("formSuccess");

    const values = () => Object.fromEntries(fields.map((f) => [f, form.elements[f].value]));

    // Same rules as contact.php.
    function validate(v) {
      const errors = {};
      const phone = v.phone.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
      if (v.name.trim().length < 2) errors.name = "Please enter your name.";
      if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a valid 10-digit mobile number.";
      if (!v.location.trim()) errors.location = "Please tell us your area or city.";
      if (v.propertyType && !propertyTypes.includes(v.propertyType)) errors.propertyType = "Please choose a property type.";
      if (v.message.length > 1000) errors.message = "Message is too long.";
      return errors;
    }

    function showError(field, message) {
      const input = form.elements[field];
      const output = document.getElementById(`${field}Error`);
      input.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (output) output.textContent = message || "";
    }

    function updateWhatsapp() {
      const v = values();
      whatsappBtn.href = waLink(`Hi, I'd like a free site survey.
Name: ${v.name}
Location: ${v.location}
Property: ${v.propertyType}
Cameras: ${v.cameras || "Not sure"}
${v.message}`);
    }

    function setSending(sending) {
      submitBtn.disabled = sending;
      submitBtn.innerHTML = sending
        ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Sending…'
        : submitLabel;
    }

    fields.forEach((f) =>
      form.elements[f].addEventListener("input", () => {
        showError(f, "");
        updateWhatsapp();
      }),
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = values();
      const errors = validate(v);
      fields.forEach((f) => showError(f, errors[f]));
      const firstInvalid = fields.find((f) => errors[f]);
      if (firstInvalid) {
        form.elements[firstInvalid].focus();
        return;
      }

      alertBox.hidden = true;
      setSending(true);
      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(v),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (data.errors) fields.forEach((f) => showError(f, data.errors[f]));
          alertBox.hidden = false;
          return;
        }
        document.getElementById("successName").textContent = v.name.trim().split(" ")[0];
        document.getElementById("successPhone").textContent = v.phone;
        form.hidden = true;
        success.hidden = false;
      } catch {
        alertBox.hidden = false;
      } finally {
        setSending(false);
      }
    });

    document.getElementById("formReset").addEventListener("click", () => {
      form.reset();
      fields.forEach((f) => showError(f, ""));
      updateWhatsapp();
      success.hidden = true;
      form.hidden = false;
    });

    updateWhatsapp();
  }
})();
