from .base import BaseTool
import json
from typing import List
from svp.models.context import ProjectContext
from svp.models.issue import Issue
from svp.models.enums import Severity, IssueCategory, Engine

class BanditTool(BaseTool):
    name = "Bandit"
    engine_type = "Security"
    executable = "bandit"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["bandit", "-f", "json", "-q", "-s", "B101", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        confidence_map = {"HIGH": 95, "MEDIUM": 80, "LOW": 50}
        known_safe_tokens = {"'bearer'", "'basic'", "'authorization_code'", "'client_credentials'", "'refresh_token'"}
        try:
            data = json.loads(stdout)
            for item in data.get("results", []):
                issue_text = item.get("issue_text", "")
                rule = item.get("test_id", "")
                # Ignore false-positive hardcoded password warnings on standard OAuth protocol strings like 'bearer'
                if rule == "B105" or "hardcoded password" in issue_text.lower():
                    if any(safe in issue_text.lower() for safe in known_safe_tokens):
                        continue

                conf = confidence_map.get(item.get("issue_confidence", "MEDIUM").upper(), 80)
                issues.append(Issue(
                    engine=Engine.SECURITY, reported_by=[self.name], category=IssueCategory.SECURITY,
                    severity=getattr(Severity, item.get("issue_severity", "MEDIUM").upper(), Severity.MEDIUM),
                    title=item.get("issue_text", "Security Issue"),
                    description=item.get("issue_text", ""), confidence=conf,
                    rule_id=rule, file_path=item.get("filename"),
                    line_number=item.get("line_number")
                ))
        except: pass
        return issues

class DetectSecretsTool(BaseTool):
    name = "DetectSecrets"
    engine_type = "Security"
    executable = "detect-secrets"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["detect-secrets", "scan", "--disable-plugin", "KeywordDetector", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        try:
            data = json.loads(stdout)
            results = data.get("results", {})
            for file_path, findings in results.items():
                for finding in findings:
                    sec_type = finding.get("type", "Detected Secret")
                    line_no = finding.get("line_number", 1)
                    issues.append(Issue(
                        engine=Engine.SECURITY,
                        reported_by=[self.name],
                        category=IssueCategory.SECURITY,
                        severity=Severity.HIGH,
                        title=f"Leaked Credential / Key: {sec_type}",
                        description=f"High-entropy secret or credential pattern ({sec_type}) detected in source code.",
                        confidence=95,
                        rule_id=f"SECRET_{sec_type.replace(' ', '_').upper()}",
                        file_path=file_path,
                        line_number=line_no
                    ))
        except Exception:
            pass
        return issues

class PipAuditTool(BaseTool):
    name = "PipAudit"
    engine_type = "Security"
    executable = "pip-audit"

    def get_command(self, context: ProjectContext) -> List[str]:
        if context.requirements_files:
            return ["pip-audit", "-f", "json", "--no-deps", "-r", context.requirements_files[0]]
        return ["pip-audit", "-f", "json", "--no-deps", "--local"]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        try:
            data = json.loads(stdout)
            deps = data.get("dependencies", [])
            for dep in deps:
                pkg_name = dep.get("name", "Unknown Package")
                installed_ver = dep.get("version", "Unknown")
                vulns = dep.get("vulns", [])
                for vuln in vulns:
                    vuln_id = vuln.get("id", "CVE")
                    fix_versions = ", ".join(vuln.get("fix_versions", [])) or "No fix available"
                    desc = vuln.get("description", "Known dependency vulnerability.")
                    issues.append(Issue(
                        engine=Engine.SECURITY,
                        reported_by=[self.name],
                        category=IssueCategory.SECURITY,
                        severity=Severity.HIGH,
                        title=f"Vulnerable Dependency: {pkg_name} ({vuln_id})",
                        description=f"{pkg_name} {installed_ver} is vulnerable to {vuln_id}. Fixed in: {fix_versions}. {desc}",
                        confidence=100,
                        rule_id=vuln_id,
                        file_path=context.requirements_files[0] if context.requirements_files else "requirements.txt",
                        line_number=1
                    ))
        except Exception:
            pass
        return issues

class SemgrepTool(BaseTool):
    name = "Semgrep"
    engine_type = "Security"
    executable = "semgrep"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["semgrep", "--config", "auto", "--json", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        try:
            data = json.loads(stdout)
            for item in data.get("results", []):
                for finding in item.get("extras", {}).get("findings", []):
                    issues.append(Issue(
                        engine=Engine.SECURITY, reported_by=[self.name], category=IssueCategory.SECURITY,
                        severity=Severity.MEDIUM, title=finding.get("message", "Pattern Match"),
                        description=finding.get("message", ""), confidence=80,
                        rule_id=finding.get("id"), file_path=finding.get("path"),
                        line_number=finding.get("line")
                    ))
        except: pass
        return issues
