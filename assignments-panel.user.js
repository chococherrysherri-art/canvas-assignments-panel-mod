// ==UserScript==
// @name         Canvas Assignments Panel Mod
// @namespace    https://github.com/chococherrysherri-art
// @version      1.0
// @description  Adds a draggable panel showing missing, upcoming, and overdue assignments in Canvas, excluding announcements.
// @author       Angela
// @match        https://udem.instructure.com/*
// @updateURL    https://gist.githubusercontent.com/chococherrysherri-art/fe53d70d55dc7ac5f71e610c82db915c/raw/assignments-panel.user.js
// @downloadURL  https://gist.githubusercontent.com/chococherrysherri-art/fe53d70d55dc7ac5f71e610c82db915c/raw/assignments-panel.user.js
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // --- Month map for Spanish ---
    const monthsEs = {
        "enero": 0, "febrero": 1, "marzo": 2, "abril": 3,
        "mayo": 4, "junio": 5, "julio": 6, "agosto": 7,
        "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
    };

    // --- Parse Spanish due date text ---
    function parseSpanishDate(text) {
        try {
            let regex = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})\s+(\d{1,2}):(\d{2})/i;
            let match = text.match(regex);
            if (match) {
                let day = parseInt(match[1], 10);
                let monthName = match[2].toLowerCase();
                let year = parseInt(match[3], 10);
                let hour = parseInt(match[4], 10);
                let minute = parseInt(match[5], 10);
                let month = monthsEs[monthName];
                if (month !== undefined) {
                    return new Date(year, month, day, hour, minute);
                }
            }
            return new Date(text); // fallback
        } catch {
            return null;
        }
    }

    // --- Create button ---
    let btn = document.createElement("button");
    btn.innerText = "Assignments Panel";
    btn.style.position = "fixed";
    btn.style.top = "10px";
    btn.style.left = "10px";
    btn.style.zIndex = "9999";
    btn.style.padding = "6px 10px";
    btn.style.background = "#4A76B2";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    document.body.appendChild(btn);

    // --- Create panel ---
    let panel = document.createElement("div");
    panel.id = "assignmentsPanel";
    panel.style.position = "fixed";
    panel.style.top = "50px";
    panel.style.right = "20px";
    panel.style.width = "340px";
    panel.style.maxHeight = "500px";
    panel.style.overflowY = "auto";
    panel.style.background = "#fff";
    panel.style.border = "2px solid #4A76B2";
    panel.style.borderRadius = "8px";
    panel.style.padding = "10px";
    panel.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    panel.style.fontFamily = "Arial, sans-serif";
    panel.style.fontSize = "14px";
    panel.style.display = "none";
    panel.style.zIndex = "10000";
    document.body.appendChild(panel);

    // --- Close button ---
    let closeBtn = document.createElement("span");
    closeBtn.innerHTML = "✖";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "10px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "#B22222";
    closeBtn.style.fontWeight = "bold";
    closeBtn.addEventListener("click", () => {
        panel.style.display = "none";
    });
    panel.appendChild(closeBtn);

    // --- Make draggable ---
    function makeDraggable(el) {
        let offsetX = 0, offsetY = 0, isDown = false;
        el.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn) return;
            isDown = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            el.style.cursor = 'move';
        });
        document.addEventListener('mouseup', () => {
            isDown = false;
            el.style.cursor = 'default';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
        });
    }
    makeDraggable(panel);

    btn.addEventListener("click", () => {
        let today = new Date();
        let nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        // --- Missing Assignments ---
        let missingBadges = Array.from(
            document.querySelectorAll(".css-xbajoi-pill__text")
        ).filter(el => el.innerText.trim() === "Faltante");

        let missingResults = missingBadges.map(badge => {
            let plannerItem = badge.closest(".PlannerItem-styles__root");
            let linkEl = plannerItem.querySelector("a.css-1ffaq8b-view-link");
            let titleEl = linkEl ? linkEl.querySelector("span[aria-hidden='true']") : null;
            let title = titleEl ? titleEl.innerText.trim() : "(No title found)";
            let href = linkEl ? linkEl.href : "#";
            return { title, badge: badge.innerText, href };
        });

        // --- Collect and classify assignments ---
let allAssignments = Array.from(document.querySelectorAll(".PlannerItem-styles__root")).map(item => {
    let linkEl = item.querySelector("a.css-1ffaq8b-view-link");
    let titleEl = linkEl ? linkEl.querySelector("span[aria-hidden='true']") : null;
    let title = titleEl ? titleEl.innerText.trim() : "(No title found)";
    let href = linkEl ? linkEl.href : "#";

    // Use the screen reader span for full due date
    let dueEl = linkEl ? linkEl.querySelector("span.css-r9cwls-screenReaderContent") : null;
    let dueText = dueEl ? dueEl.innerText.trim() : null;
    let dueDate = dueText ? parseSpanishDate(dueText) : null;

    return { title, href, dueText, dueDate };
});

// --- Upcoming (next 7 days) ---
let upcomingResults = allAssignments.filter(item => {
    return item.dueDate && item.dueDate >= today && item.dueDate <= nextWeek;
});

// --- Overdue (before today) ---
let overdueResults = allAssignments.filter(item => {
    return item.dueDate && item.dueDate < today;
});



        // --- Update panel ---
panel.innerHTML = "<h3 style='margin-top:0;color:#4A76B2;'>Assignments Overview</h3>";
panel.appendChild(closeBtn);

// Missing section
panel.innerHTML += "<h4 style='color:#B22222;'>Missing Assignments</h4>";
if (missingResults.length > 0) {
    panel.innerHTML += "<ul style='padding-left:20px;'>";
    missingResults.forEach(item => {
        panel.innerHTML += `<li><a href="${item.href}" target="_blank" style="color:#2B7ABC;text-decoration:none;font-weight:bold;">${item.title}</a> — <span style="color:#B22222;font-weight:bold;">${item.badge}</span></li>`;
    });
    panel.innerHTML += "</ul>";
} else {
    panel.innerHTML += "<p>No missing assignments 🎉</p>";
}

// Upcoming section
panel.innerHTML += "<h4 style='color:#2B7ABC;'>Upcoming (Next 7 Days)</h4>";
if (upcomingResults.length > 0) {
    panel.innerHTML += "<ul style='padding-left:20px;'>";
    upcomingResults.forEach(item => {
        panel.innerHTML += `<li><a href="${item.href}" target="_blank" style="color:#2B7ABC;text-decoration:none;font-weight:bold;">${item.title}</a> — <span style="color:#555;">${item.dueText}</span></li>`;
    });
    panel.innerHTML += "</ul>";
} else {
    panel.innerHTML += "<p>No upcoming assignments in the next week</p>";
}

// Overdue section
panel.innerHTML += "<h4 style='color:#8B0000;'>Overdue Assignments</h4>";
if (overdueResults.length > 0) {
    panel.innerHTML += "<ul style='padding-left:20px;'>";
    overdueResults.forEach(item => {
        panel.innerHTML += `<li><a href="${item.href}" target="_blank" style="color:#8B0000;text-decoration:none;font-weight:bold;">${item.title}</a> — <span style="color:#555;">${item.dueText}</span></li>`;
    });
    panel.innerHTML += "</ul>";
} else {
    panel.innerHTML += "<p>No overdue assignments 🎉</p>";
}

// Toggle panel visibility
panel.style.display = panel.style.display === "none" ? "block" : "none";
 }); })();
