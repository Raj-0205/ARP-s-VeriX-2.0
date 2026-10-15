from .base import BaseTool
import json
from typing import List
from svp.models.context import ProjectContext
from svp.models.issue import Issue
from svp.models.enums import Severity, IssueCategory, Engine

class RuffTool(BaseTool):
    name = "Ruff"
    engine_type = "Quality"
    executable = "ruff"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["ruff", "check", "--output-format=json", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        try:
            data = json.loads(stdout)
            for item in data:
                code = item.get("code") or ""
                if code.startswith("UP") or code.startswith("I") or code.startswith("PIE") or code.startswith("RUF"):
                    sev = Severity.LOW
                elif code in ("F401", "F841", "E722"):
                    sev = Severity.LOW
                elif code in ("E999", "F821", "F822"):
                    sev = Severity.HIGH
                else:
                    sev = Severity.MEDIUM

                issues.append(Issue(
                    engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.STATIC,
                    severity=sev, title=item.get("message", "Linting Issue"),
                    description=item.get("message", ""), confidence=90,
                    rule_id=code, file_path=item.get("filename"),
                    line_number=item.get("location", {}).get("row"),
                    column_number=item.get("location", {}).get("column")
                ))
        except: pass
        return issues

class MypyTool(BaseTool):
    name = "Mypy"
    engine_type = "Quality"
    executable = "mypy"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["mypy", "--ignore-missing-imports", "--no-error-summary", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        for line in stdout.splitlines():
            if "error:" in line:
                parts = line.split(":", 3)
                if len(parts) >= 4:
                    issues.append(Issue(
                        engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.STATIC,
                        severity=Severity.MEDIUM, title="Type Error",
                        description=parts[3].strip(), confidence=95,
                        file_path=parts[0].strip(), line_number=int(parts[1])
                    ))
        return issues

class PyflakesTool(BaseTool):
    name = "Pyflakes"
    engine_type = "Quality"
    executable = "pyflakes"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["pyflakes", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        for line in stdout.splitlines():
            if ":" in line:
                parts = line.split(":", 2)
                if len(parts) >= 3:
                    issues.append(Issue(
                        engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.STATIC,
                        severity=Severity.LOW, title="Logic Issue",
                        description=parts[2].strip(), confidence=80,
                        file_path=parts[0].strip(), line_number=int(parts[1])
                    ))
        return issues
