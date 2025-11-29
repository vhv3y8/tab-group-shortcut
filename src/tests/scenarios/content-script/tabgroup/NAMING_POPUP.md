# Naming popup

- GIVEN at content script page AND single tab is selected AND tab does NOT have tab group AND naming popup option is true
- WHEN user presses storage set shortcut
- THEN group current tab AND open naming popup

---

- GIVEN at naming popup
- WHEN user presses cancel or escape key
- THEN still groups current tab AND close naming popup

---

- GIVEN at naming popup
- WHEN user types name and press ok or enter key
- THEN groups current tab AND set tab group name AND close naming popup
