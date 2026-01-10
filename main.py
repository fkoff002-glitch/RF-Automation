import json
import os
import subprocess
import logging
import platform
import ipaddress
import concurrent.futures
import re
import time
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List

# --- CONFIGURATION ---
DB_FILE = "inventory.json"
SNMP_COMMUNITY = "airspan"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - NOC - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE HELPERS ---
def load_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f: json.dump([], f)
        return []
    try:
        with open(DB_FILE, 'r') as f: return json.load(f)
    except: return []

def save_db(data):
    with open(DB_FILE, 'w') as f: json.dump(data, f, indent=4)

# --- DIAGNOSTICS ---
def ping_target(name, ip):
    if not ip or ip in ["N/A", ""]: 
        return {"target": name, "ip": "N/A", "status": "SKIPPED", "loss": "N/A", "latency": "N/A"}
    
    cmd = ["fping", "-c", "5", "-t", "500", "-p", "25", "-q", ip]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        loss = "100%"
        match_loss = re.search(r"%loss = .*/(\d+%)", res.stderr)
        if match_loss: loss = match_loss.group(1)
        
        status = "UP" if res.returncode == 0 else "DOWN"
        return {"target": name, "ip": ip, "status": status, "loss": loss}
    except:
        return {"target": name, "ip": ip, "status": "ERROR", "loss": "?", "latency": "?"}

def get_snmp_value(ip, oid):
    cmd = ["snmpget", "-v", "2c", "-c", SNMP_COMMUNITY, "-O", "qv", ip, oid]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0: return res.stdout.strip().replace('"', '')
        return None
    except: return None

def get_signal_sample(ip):
    oid_1 = "1.3.6.1.4.1.43356.2.1.2.6.1.1.3.1"
    oid_2 = "1.3.6.1.4.1.43356.2.1.2.6.1.1.3.2"
    r1 = get_snmp_value(ip, oid_1)
    r2 = get_snmp_value(ip, oid_2)
    if r1 and r2:
        try:
            val1 = float(r1) / 10 * -1 if float(r1) > 0 else float(r1) / 10
            val2 = float(r2) / 10 * -1 if float(r2) > 0 else float(r2) / 10
            if val1 > 0: val1 *= -1
            if val2 > 0: val2 *= -1
            return (val1 + val2) / 2
        except: return None
    return None

def check_radio_health(name, ip):
    result = ping_target(name, ip)
    if result['status'] != "UP": 
        result['data'] = {"rssi": "N/A", "stability": "Offline", "lan_speed": "N/A"}
        return result 

    samples = []
    for _ in range(3):
        val = get_signal_sample(ip)
        if val: samples.append(val)
        time.sleep(0.2)

    final_rssi = "N/A"
    stability = "Unknown"
    
    if samples:
        avg = sum(samples) / len(samples)
        diff = max(samples) - min(samples)
        if diff < 2.5:
            stability = "Stable 🟢"
            final_rssi = f"{avg:.1f} dBm"
        elif diff < 6.0:
            stability = "Jittery ⚠️"
            final_rssi = f"{avg:.1f} dBm (±{diff:.1f})"
        else:
            stability = "UNSTABLE 🔴"
            final_rssi = f"{min(samples):.1f} ~ {max(samples):.1f} dBm"

    speed_oid = "1.3.6.1.2.1.2.2.1.5.1"
    raw_speed = get_snmp_value(ip, speed_oid)
    final_speed = "N/A"
    if raw_speed:
        try: final_speed = f"{int(int(raw_speed)/1000000)} Mbps"
        except: pass

    result['data'] = {"rssi": final_rssi, "stability": stability, "lan_speed": final_speed}
    return result

# --- API ROUTES ---
@app.get("/api/inventory")
def get_inventory():
    return load_db()

@app.post("/api/inventory")
def update_inventory(data: List[dict]):
    save_db(data)
    return {"status": "success", "count": len(data)}

@app.post("/api/diagnose")
def run_diagnosis(item: dict = Body(...)):
    ip = item.get("ip")
    db = load_db()
    record = next((item for item in db if item["Client_IP"] == ip), None)
    base_ip = record.get("Base_IP", "N/A") if record else "N/A"
    gateway_ip = "N/A"
    try:
        if base_ip != "N/A": gateway_ip = str(ipaddress.IPv4Address(base_ip) - 1)
    except: pass

    results = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        f1 = executor.submit(check_radio_health, "Client Radio", ip)
        f2 = executor.submit(check_radio_health, "Base Radio", base_ip)
        f3 = executor.submit(ping_target, "Gateway (GW)", gateway_ip)
        for f in concurrent.futures.as_completed([f1, f2, f3]):
            results.append(f.result())

    order = {"Client Radio": 1, "Base Radio": 2, "Gateway (GW)": 3}
    results.sort(key=lambda x: order.get(x["target"], 4))

    client = next((r for r in results if r["target"] == "Client Radio"), None)
    base = next((r for r in results if r["target"] == "Base Radio"), None)
    gw = next((r for r in results if r["target"] == "Gateway (GW)"), None)

    final_status = "UNKNOWN"
    cause = "Analyzing..."

    if client['status'] == "UP":
        if "UNSTABLE" in client['data'].get('stability', ''):
            final_status = "UNSTABLE ⚠️"
            cause = f"Fluctuating Signal"
        else:
            final_status = "LINK UP 🟢"
            cause = "Link Optimal."
    elif base['status'] == "UP":
        final_status = "CLIENT DOWN 🔴"
        cause = "Base UP. Client Unreachable."
    elif gw['status'] == "UP":
        final_status = "SECTOR DOWN 🔴"
        cause = "Gateway UP. Base DOWN."
    else:
        final_status = "POP ISSUE ⚫"
        cause = "Gateway Unreachable."

    return {"final_status": final_status, "cause": cause, "steps": results, "topology": {"client": client, "base": base, "gw": gw}}

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
