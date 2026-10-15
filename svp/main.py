import argparse
import json
from datetime import datetime
from svp.engines.scanner import ProjectScanner
from svp.engines.runner import ToolRunner
from svp.verifier.evidence import EvidenceExtractor
from svp.verifier.recommendation import RecommendationEngine
from svp.models.result import ScanResult

def main():
    parser = argparse.ArgumentParser(description="SVP - Software Verification Platform")
    parser.add_argument("target_dir", help="Path to project directory")
    args = parser.parse_args()

    print(f"\n🚀 Initializing SVP Scan on: {args.target_dir}")
    print("=" * 60)

    # PHASE 1: SCANNER
    print("📁 [Phase 1] Scanning project structure...")
    try:
        scanner = ProjectScanner(args.target_dir)
        context = scanner.scan()
    except Exception as e:
        print(f"❌ Scanner Error: {e}")
        return

    scan_result = ScanResult(project_context=context)
    print(f"✅ Total Files: {context.total_files} | Python Files: {len(context.python_files)}")
    print("-" * 60)

    # PHASE 2: TOOL RUNNER
    print("🔍 [Phase 2] Running Verification Tools...")
    runner = ToolRunner()
    raw_issues = runner.run_all(context)
    print("-" * 60)

    # PHASE 3: VERIFIER PIPELINE
    print("🛡️ [Phase 3] Running Verifier Pipeline (Evidence & Recommendations)...")
    extractor = EvidenceExtractor()
    recommender = RecommendationEngine()
    verified_issues = []
    for issue in raw_issues:
        issue = extractor.enrich(issue)
        issue = recommender.enrich(issue)
        verified_issues.append(issue)
        
    scan_result.issues.extend(verified_issues)
    print("-" * 60)

    # REPORT
    scan_result.end_time = datetime.now()
    
    # Create a safe dynamic filename (e.g., "sims_v2.2_svp_report.json")
    safe_proj_name = context.project_name.replace(" ", "_").lower()
    report_file = f"{safe_proj_name}_svp_report.json"
    
    with open(report_file, "w") as f:
        json.dump(scan_result.to_dict(), f, indent=4)
        
    stats = scan_result.get_statistics()
    print("🏁 Scan Finished!")
    print(f"🎯 Total Issues Found : {stats['TOTAL_ISSUES']}")
    print(f"🚨 CRITICAL           : {stats['by_severity']['CRITICAL']}")
    print(f"🔴 HIGH               : {stats['by_severity']['HIGH']}")
    print(f"🟡 MEDIUM             : {stats['by_severity']['MEDIUM']}")
    print(f"🔵 LOW                : {stats['by_severity']['LOW']}")
    print(f"\n📊 Report generated   : {report_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
