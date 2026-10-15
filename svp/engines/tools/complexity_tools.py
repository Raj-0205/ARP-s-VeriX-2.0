from .base import BaseTool
import re
from typing import List
from svp.models.context import ProjectContext
from svp.models.issue import Issue
from svp.models.enums import Severity, IssueCategory, Engine

class VultureTool(BaseTool):
    name = "Vulture"
    engine_type = "Complexity"
    executable = "vulture"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["vulture", "--min-confidence", "70", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        issues = []
        pattern = re.compile(r"^(.*?):(\d+):\s+(.*?)(?:\s+\((\d+)%\s+confidence\))?$")
        for line in stdout.splitlines():
            match = pattern.match(line)
            if match:
                desc = match.group(3).strip()
                conf = int(match.group(4)) if match.group(4) else 80
                issues.append(Issue(
                    engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.STATIC,
                    severity=Severity.LOW, title="Dead Code",
                    description=desc, confidence=conf,
                    file_path=match.group(1), line_number=int(match.group(2))
                ))
        return issues

class RadonTool(BaseTool):
    name = "Radon"
    engine_type = "Complexity"
    executable = "radon"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["radon", "cc", "-s", "--json", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        import json
        issues = []
        try:
            data = json.loads(stdout)
            for file, results in data.items():
                for res in results:
                    if res.get('complexity', 0) > 10: # Threshold for High Complexity
                        issues.append(Issue(
                            engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.PERFORMANCE,
                            severity=Severity.MEDIUM, title="High Complexity",
                            description=f"Function {res.get('name')} has high complexity ({res.get('complexity')})",
                            confidence=90, file_path=file, line_number=res.get('lineno')
                        ))
        except: pass
        return issues

class PylintTool(BaseTool):
    name = "Pylint"
    engine_type = "Complexity"
    executable = "pylint"

    def get_command(self, context: ProjectContext) -> List[str]:
        return ["pylint", "--errors-only", "--disable=import-error,no-name-in-module", "--output-format=json", *context.python_files]

    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        import json
        issues = []
        try:
            data = json.loads(stdout)
            for item in data:
                # E: Error, F: Fatal
                item_type = item.get("type", "error").lower()
                sev = Severity.HIGH if item_type == "fatal" else Severity.MEDIUM
                issues.append(Issue(
                    engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.STATIC,
                    severity=sev, title=item.get("message", "Runtime/Syntax Defect"),
                    description=item.get("message", ""), confidence=85,
                    rule_id=item.get("symbol"), file_path=item.get("path"),
                    line_number=item.get("line")
                ))
        except: pass
        return issues
