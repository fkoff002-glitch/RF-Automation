📡 RF Automation - ISP Radio Link Monitor
A full-stack monitoring solution for Internet Service Providers (ISPs) to track the health, latency, and connectivity status of radio links in real-time. The system fetches inventory from Google Sheets, performs active diagnostics using fping on a Dockerized backend, and visualizes the data on a lightweight frontend.

🚀 Live Demo
Frontend (Dashboard): https://deft-kitten-7ca5fb.netlify.app/

Backend (API): https://rf-automation-sio4.onrender.com

🛠 Architecture
The system consists of three main components:

Backend (Node.js/Express on Render):

Inventory Manager: Fetches radio link details (IPs, Clients, POPs) from a Google Sheet.

Diagnostic Engine: Uses a Dockerized environment to run fping (High-performance ping) on Client, Base, and Gateway IPs.

API: Exposes JSON endpoints for the frontend to consume.

Frontend (Static HTML/JS on Netlify):

Auto-detects backend environment (Local vs Prod).

Visualizes network hops (Client → Base → Gateway) with color-coded status indicators.

Database (Google Sheets):

Acts as a dynamic inventory database that is easy for staff to update.

✨ Features
⚡ Active Monitoring: Checks connectivity for the full path (Client IP, Base Station IP, Gateway IP).

📊 Visual Path Trace: Interactive UI showing exactly where a connection fails (e.g., if Base is up but Gateway is down).

☁️ Cloud Native:

Backend runs on Render (Docker support for fping capabilities).

Frontend hosts on Netlify (Global CDN).

wm Google Sheets Integration: No database to manage; just edit a spreadsheet.

🛡️ Security: Uses Google Service Account authentication (Base64 encoded for cloud deployment).
rf-automation/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route logic (linkController.js)
│   │   └── services/      # Business logic (fping, googleSheets)
│   ├── Dockerfile         # Docker config for Render (Node 18 + fping)
│   ├── server.js          # Express App Entry point
│   └── package.json       # Backend dependencies
│
├── frontend/
│   └── index.html         # Dashboard UI (Single file app)
│
└── netlify.toml           # Netlify deployment config
