(function () {
  "use strict";

  var volumeInput = document.getElementById("volume");
  var hourInput = document.getElementById("hour");
  var minuteInput = document.getElementById("minute");
  var dripCustomInput = document.getElementById("dripCustom");

  var volumeQuick = document.getElementById("volumeQuick");
  var timeQuick = document.getElementById("timeQuick");
  var dripQuick = document.getElementById("dripQuick");

  var currentDripLabel = document.getElementById("currentDripLabel");

  var errorMsg = document.getElementById("errorMsg");
  var resultBlock = document.getElementById("resultBlock");
  var primaryResult = document.getElementById("primaryResult");
  var altResult = document.getElementById("altResult");
  var mlhrResult = document.getElementById("mlhrResult");
  var gttminResult = document.getElementById("gttminResult");

  var resetBtn = document.getElementById("resetBtn");

  var selectedDrip = 20; // default drip factor

  function setActiveDripButton(value) {
    var btns = dripQuick.querySelectorAll(".drip-btn");
    for (var i = 0; i < btns.length; i++) {
      var btnVal = parseFloat(btns[i].getAttribute("data-drip"));
      if (btnVal === value) {
        btns[i].classList.add("active");
      } else {
        btns[i].classList.remove("active");
      }
    }
  }

  function updateDripLabel() {
    if (selectedDrip && selectedDrip > 0) {
      currentDripLabel.textContent = formatNumber(selectedDrip, 0) + " gtt/mL";
    } else {
      currentDripLabel.textContent = "-";
    }
  }

  function formatNumber(num, decimals) {
    if (!isFinite(num)) return "-";
    var fixed = num.toFixed(decimals);
    // remove trailing .0 noise is not required per spec; keep as-is
    return fixed;
  }

  function roundSmart(num) {
    return Math.round(num);
  }

  function calculate() {
    var volume = parseFloat(volumeInput.value);
    var hour = parseFloat(hourInput.value);
    var minute = parseFloat(minuteInput.value);
    var drip = selectedDrip;

    if (isNaN(hour)) hour = 0;
    if (isNaN(minute)) minute = 0;

    var totalMinutes = hour * 60 + minute;

    var valid =
      !isNaN(volume) && volume > 0 &&
      totalMinutes > 0 &&
      !isNaN(drip) && drip > 0;

    if (!valid) {
      showError();
      return;
    }

    var totalHours = totalMinutes / 60;
    var mlPerHr = volume / totalHours;
    var gttPerMin = (volume * drip) / totalMinutes;

    if (!isFinite(mlPerHr) || !isFinite(gttPerMin) || gttPerMin <= 0) {
      showError();
      return;
    }

    var secPerDrop = 60 / gttPerMin;

    showResult(mlPerHr, gttPerMin, secPerDrop);
  }

  function showError() {
    errorMsg.classList.remove("hidden");
    resultBlock.classList.add("hidden");
  }

  function showResult(mlPerHr, gttPerMin, secPerDrop) {
    errorMsg.classList.add("hidden");
    resultBlock.classList.remove("hidden");

    if (secPerDrop >= 1) {
      primaryResult.textContent = "약 " + formatNumber(secPerDrop, 1) + "초에 1방울";
      altResult.classList.add("hidden");
    } else {
      var dropsPerSec = 1 / secPerDrop;
      var dropsPer5Sec = roundSmart(dropsPerSec * 5);
      primaryResult.textContent = "약 5초에 " + dropsPer5Sec + "방울";
      altResult.textContent = "약 " + formatNumber(dropsPerSec, 1) + "방울/초";
      altResult.classList.remove("hidden");
    }

    mlhrResult.textContent = formatNumber(mlPerHr, 1) + " mL/hr";
    gttminResult.textContent = formatNumber(gttPerMin, 1) + " gtt/min";
  }

  // --- Volume quick buttons ---
  volumeQuick.addEventListener("click", function (e) {
    var btn = e.target.closest(".quick-btn");
    if (!btn) return;
    volumeInput.value = btn.getAttribute("data-volume");
    calculate();
  });

  // --- Time quick buttons ---
  timeQuick.addEventListener("click", function (e) {
    var btn = e.target.closest(".quick-btn");
    if (!btn) return;
    hourInput.value = btn.getAttribute("data-hour");
    minuteInput.value = btn.getAttribute("data-min");
    calculate();
  });

  // --- Drip quick buttons ---
  dripQuick.addEventListener("click", function (e) {
    var btn = e.target.closest(".drip-btn");
    if (!btn) return;
    selectedDrip = parseFloat(btn.getAttribute("data-drip"));
    dripCustomInput.value = "";
    setActiveDripButton(selectedDrip);
    updateDripLabel();
    calculate();
  });

  // --- Custom drip input ---
  dripCustomInput.addEventListener("input", function () {
    var val = parseFloat(dripCustomInput.value);
    if (!isNaN(val) && val > 0) {
      selectedDrip = val;
      setActiveDripButton(val);
      updateDripLabel();
    } else {
      selectedDrip = NaN;
      setActiveDripButton(NaN);
      currentDripLabel.textContent = "-";
    }
    calculate();
  });

  // --- Direct number inputs ---
  [volumeInput, hourInput, minuteInput].forEach(function (input) {
    input.addEventListener("input", calculate);
  });

  // --- Reset ---
  resetBtn.addEventListener("click", function () {
    volumeInput.value = "";
    hourInput.value = "";
    minuteInput.value = "";
    dripCustomInput.value = "";
    selectedDrip = 20;
    setActiveDripButton(20);
    updateDripLabel();
    showError();
  });

  // --- Init ---
  setActiveDripButton(selectedDrip);
  updateDripLabel();
  showError();

  // --- Register service worker for offline use ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // offline registration failure is non-critical; calculator still works
      });
    });
  }
})();
