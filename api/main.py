import sys
import os
import uuid
import hashlib
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

# ==============================================================================
# 1. ENVIRONMENT SETUP (Absolute Pathing)
# ==============================================================================
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from svp.engines.scanner import ProjectScanner
    from svp.engines.runner import ToolRunner
    from svp.verifier.evidence import EvidenceExtractor
    from svp.verifier.recommendation import RecommendationEngine
except ImportError as e:
    print(f"FATAL: Engine Import Failure: {e}")
    sys.exit(1)

# ==============================================================================
# 2. SECURITY (Raw Manual Auth - Zero Dependencies)
# ==============================================================================
SALT = "VeriX_Secure_2026_Salt_Value"
STORED_USERNAME = "Admin"
STORED_PASSWORD_HASH = hashlib.sha256((SALT + "Verix2.0").encode()).hexdigest()

# In-memory session store
sessions = {} # {token: username}

def verify_token(request: Request):
    """Manual token validation to avoid any FastAPI dependency triggers."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    if token not in sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return sessions[token]

# ==============================================================================
# 3. APP INITIALIZATION
# ==============================================================================
app = FastAPI(title="VeriX Enterprise API v2.2 - Hardened")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scans = {}
total_scans_count = 0

# ==============================================================================
# 4. ENGINE ORCHESTRATION (SVP Pipeline)
# ==============================================================================
SEVERITY_ORDER = {
    "CRITICAL": 5,
    "HIGH": 4,
    "MEDIUM": 3,
    "LOW": 2,
    "INFO": 1
}

# Proprietary VeriX Engine Rebranding Mapping (Zero 3rd-party tool leakage)
TOOL_BRANDING = {
    "Semgrep": "VeriX Pattern Engine",
    "DetectSecrets": "VeriX Credential Guardian",
    "Bandit": "VeriX Security Core",
    "PipAudit": "VeriX Dependency Auditor",
    "Safety": "VeriX Dependency Auditor",
    "Ruff": "VeriX Syntax Inspector",
    "Mypy": "VeriX Type Rigor Engine",
    "Radon": "VeriX Complexity Metric",
}

def get_device_info() -> dict:
    """Collects operating system, hardware, and environment specifications."""
    import platform
    return {
        "os": platform.system(),
        "os_release": platform.release(),
        "os_version": platform.version(),
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "processor": platform.processor() or platform.machine(),
        "python_version": platform.python_version(),
        "cpu_cores": os.cpu_count() or 1,
        "hostname": platform.node()
    }

def make_project_relative_path(file_path: str, root_path: Path) -> str:
    """
    Normalizes file path to start strictly from the target project directory:
    e.g. /home/user/.../VeriX-main/svp/core.py -> VeriX-main/svp/core.py
    """
    if not file_path or file_path == "Unknown":
        return "Unknown"
    p = Path(file_path).resolve()
    root_resolved = root_path.resolve()
    proj_name = root_resolved.name
    try:
        rel = p.relative_to(root_resolved)
        return f"{proj_name}/{rel.as_posix()}"
    except ValueError:
        posix = p.as_posix()
        if proj_name in posix:
            idx = posix.find(proj_name)
            return posix[idx:]
        return f"{proj_name}/{p.name}"

def execute_svp_pipeline(target_path: str):
    start_time = datetime.now()
    target_root = Path(target_path).resolve()
    proj_name = target_root.name
    try:
        # Step A: Scan
        scanner = ProjectScanner(target_path)
        context = scanner.scan()
        
        # Step B: Run tools
        runner = ToolRunner()
        raw_results = runner.run_all(context)
        
        # Step C: Enrich
        verifier = EvidenceExtractor()
        rec_gen = RecommendationEngine()
        
        # Step D: Consensus Clustering & Deduplication
        clusters = {} # key: (file_path, line_number) -> list of issues
        for issue in raw_results:
            if hasattr(issue, 'to_dict'):
                d = issue.to_dict()
                i_id = d.get('issue_id')
                sev = str(d.get('severity', 'MEDIUM')).upper()
                file_p = d.get('file_path') or 'Unknown'
                line_no = d.get('line_number') or 0
                title = d.get('title') or 'Anomaly Detected'
                cat = str(d.get('category', 'STATIC')).upper()
                eng = str(d.get('engine', 'UNKNOWN')).upper()
                tools = d.get('reported_by', [])
                rule_id = d.get('rule_id')
                base_conf = d.get('confidence', 70)
            else:
                i_id = getattr(issue, 'issue_id', getattr(issue, 'id', 'UNK'))
                sev = str(getattr(issue, 'severity', 'MEDIUM')).upper()
                file_p = getattr(issue, 'file_path', getattr(issue, 'file', 'Unknown'))
                line_no = getattr(issue, 'line_number', getattr(issue, 'line', 0))
                title = getattr(issue, 'title', getattr(issue, 'message', 'Anomaly Detected'))
                cat = str(getattr(issue, 'category', 'STATIC')).upper()
                eng = str(getattr(issue, 'engine', 'UNKNOWN')).upper()
                tools = getattr(issue, 'reported_by', [])
                rule_id = getattr(issue, 'rule_id', None)
                base_conf = getattr(issue, 'confidence', 70)

            if sev not in SEVERITY_ORDER:
                sev = 'MEDIUM'

            cluster_key = (str(file_p), int(line_no) if line_no else 0)
            if cluster_key not in clusters:
                clusters[cluster_key] = []
            clusters[cluster_key].append({
                'raw': issue,
                'id': str(i_id),
                'sev': sev,
                'file': str(file_p),
                'line': int(line_no) if line_no else 0,
                'title': str(title),
                'category': str(cat),
                'engine': str(eng),
                'tools': list(tools) if isinstance(tools, (list, tuple)) else [str(tools)],
                'rule_id': str(rule_id) if rule_id else None,
                'confidence': int(base_conf) if base_conf else 70
            })

        final_issues = []
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        engine_counts = {}
        category_counts = {}

        for (file_p, line_no), group in clusters.items():
            # 1. Deduplicate tools
            combined_tools = []
            for item in group:
                for t in item['tools']:
                    if t and t not in combined_tools:
                        combined_tools.append(t)
            
            # 2. Highest severity in cluster
            highest_sev = max((item['sev'] for item in group), key=lambda s: SEVERITY_ORDER.get(s, 0))

            # 3. Consensus Confidence Scoring
            tool_count = len(combined_tools)
            if tool_count >= 3:
                final_conf = 100
            elif tool_count == 2:
                final_conf = 85
            else:
                final_conf = max(item['confidence'] for item in group)

            # 4. Filter out confidence <= 30%
            if final_conf <= 30:
                continue

            # 5. Best representative item for title & enrichment
            best_item = group[0]
            for it in group:
                if it['engine'] == 'SECURITY':
                    best_item = it
                    break

            rep_issue = best_item['raw']
            rep_id = best_item['id']
            rep_title = best_item['title']
            rep_cat = best_item['category']

            # 6. Evidence extraction (uses real file_p on disk)
            evidence = "Evidence unavailable"
            if hasattr(verifier, 'enrich'):
                try:
                    enriched = verifier.enrich(rep_issue)
                    if hasattr(enriched, 'evidence') and isinstance(enriched.evidence, list) and enriched.evidence:
                        evidence = "\n".join(enriched.evidence)
                except Exception:
                    pass

            # 7. Recommendation mapping
            recommendation = "Review code around this location according to best practices."
            if hasattr(rec_gen, 'enrich'):
                try:
                    rec_issue = rec_gen.enrich(rep_issue)
                    if hasattr(rec_issue, 'suggested_fix') and rec_issue.suggested_fix:
                        recommendation = rec_issue.suggested_fix
                except Exception:
                    pass

            # 8. Clean project-relative path (Starts strictly from project root, e.g. VeriX-main/...)
            rel_file_path = make_project_relative_path(file_p, target_root)
            location_str = f"{rel_file_path}:{line_no}" if line_no else rel_file_path

            # Priority Score for Ranking: Severity (100-500) + Confidence (0-100) + (Multi-tool bonus 50 per tool)
            sev_score = SEVERITY_ORDER.get(highest_sev, 2) * 100
            priority_score = sev_score + final_conf + (tool_count * 50)

            # Proprietary VeriX Engine Rebranding
            branded_tools = [TOOL_BRANDING.get(t, "VeriX Security Core") for t in combined_tools]
            if len(branded_tools) > 1:
                display_engine = "VeriX Consensus Engine"
            elif branded_tools:
                display_engine = branded_tools[0]
            else:
                display_engine = "VeriX Consensus"

            issue_dict = {
                "id": str(rep_id),
                "issue_id": str(rep_id),
                "issue": rep_title,
                "title": rep_title,
                "message": rep_title,
                "severity": highest_sev,
                "category": rep_cat,
                "engine": display_engine,
                "confidence": final_conf,
                "reported_by": branded_tools if len(branded_tools) > 1 else [display_engine],
                "file": rel_file_path,
                "file_path": rel_file_path,
                "line": line_no,
                "line_number": line_no,
                "location": location_str,
                "evidence": evidence,
                "recommendation": recommendation,
                "priority_score": priority_score
            }
            final_issues.append(issue_dict)

            # Update statistics
            severity_counts[highest_sev] = severity_counts.get(highest_sev, 0) + 1
            for b_tool in branded_tools:
                engine_counts[b_tool] = engine_counts.get(b_tool, 0) + 1
            category_counts[rep_cat] = category_counts.get(rep_cat, 0) + 1

        # Sort issues: Highest priority first
        final_issues.sort(key=lambda x: x['priority_score'], reverse=True)

        report_id = f"VXR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        end_time = datetime.now()
        duration = round((end_time - start_time).total_seconds(), 2)

        return {
            "report_id": report_id,
            "scan_info": {
                "report_id": report_id,
                "scan_id": report_id,
                "timestamp": datetime.now().isoformat(),
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration
            },
            "device_info": get_device_info(),
            "project": {
                "name": proj_name,
                "root_dir": proj_name,
                "path": proj_name,
                "total_files": context.total_files,
                "file_types": context.file_types,
                "entry_points_count": len(context.entry_points),
                "has_git": context.has_git,
                "has_venv": context.has_venv
            },
            "summary": {
                "TOTAL_ISSUES": len(final_issues),
                "by_severity": severity_counts,
                "by_engine": engine_counts,
                "by_category": category_counts
            },
            "issues": final_issues
        }
    except Exception as e:
        print(f"Pipeline Error: {e}")
        raise e

# ==============================================================================
# 5. API ENDPOINTS (Zero-Dependency JSON Handlers)
# ==============================================================================

@app.get("/health")
async def health():
    return {"status": "healthy", "engine": "SVP v2.2", "timestamp": datetime.now().isoformat()}

@app.get("/stats")
async def get_stats(request: Request):
    verify_token(request)
    return {"total_scans": total_scans_count}

@app.post("/token")
async def login(request: Request):
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
        
        input_hash = hashlib.sha256((SALT + password).encode()).hexdigest()
        if username == STORED_USERNAME and input_hash == STORED_PASSWORD_HASH:
            token = uuid.uuid4().hex
            sessions[token] = STORED_USERNAME
            return {"access_token": token, "token_type": "bearer"}
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request format")

@app.post("/logout")
async def logout(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if token in sessions:
            del sessions[token]
    return {"message": "Logged out successfully"}

@app.post("/scan")
async def start_scan(request: Request):
    verify_token(request)
    global total_scans_count
    try:
        data = await request.json()
        target_path = data.get("path")
        if not target_path:
            raise HTTPException(status_code=400, detail="Path is required")
        
        report = execute_svp_pipeline(target_path)
        report_id = report["report_id"]
        
        report_dir = PROJECT_ROOT / "VXS_Reports"
        report_dir.mkdir(parents=True, exist_ok=True)
        project_name = Path(target_path).name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"{project_name}_{timestamp}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=4)

        scans[report_id] = {
            "status": "completed", 
            "results": report["issues"], 
            "path": project_name,
            "timestamp": datetime.now().isoformat(),
            "report_path": str(report_file),
            "full_report": report
        }
        return {
            "scan_id": report_id,
            "report_id": report_id,
            "status": "completed",
            "results": report["issues"],
            "report": report
        }
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/results/{scan_id}")
async def get_results(scan_id: str, request: Request):
    verify_token(request)
    if scan_id not in scans:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    return scans[scan_id]

@app.get("/report-metadata")
async def get_report_metadata(scan_id: str, request: Request):
    verify_token(request)
    if scan_id not in scans:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    scan = scans[scan_id]
    now = datetime.now()
    return {
        "project_name": Path(scan['path']).name,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "request_details": f"Detailed report request for project {Path(scan['path']).name}. Scanned at {now.strftime('%H:%M:%S')}."
    }
