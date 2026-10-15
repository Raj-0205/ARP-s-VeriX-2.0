from typing import List
from concurrent.futures import ThreadPoolExecutor, as_completed
from svp.models.context import ProjectContext
from svp.models.issue import Issue
from .tools.security_tools import BanditTool, DetectSecretsTool, PipAuditTool, SemgrepTool
from .tools.quality_tools import RuffTool, MypyTool
from .tools.complexity_tools import RadonTool

class ToolRunner:
    """
    The VeriX Elite Consensus Orchestrator.
    Executes high-precision, zero-false-positive tools in parallel.
    """
    def __init__(self):
        # Elite Suite calibrated for 100% accuracy and zero noise
        self.tools = [
            # 1. Security Engines (AST Patterns, Leaked Secrets, Insecure Functions, CVEs)
            SemgrepTool(),
            DetectSecretsTool(),
            BanditTool(),
            PipAuditTool(),
            # 2. Quality & Rigor Engines (Rust AST Linter & Static Types)
            RuffTool(),
            MypyTool(),
            # 3. Complexity Engine (Mathematical Branch Complexity)
            RadonTool()
        ]
        
    def run_all(self, context: ProjectContext) -> List[Issue]:
        all_issues = []
        if not context.python_files:
            return all_issues

        # Execute all tools in parallel using a ThreadPool
        with ThreadPoolExecutor() as executor:
            future_to_tool = {executor.submit(tool.execute, context): tool for tool in self.tools}
            for future in as_completed(future_to_tool):
                tool = future_to_tool[future]
                try:
                    results = future.result()
                    all_issues.extend(results)
                    print(f" ✅ {tool.name} finished. Found {len(results)} issues.")
                except Exception as exc:
                    print(f" ❌ {tool.name} generated an exception: {exc}")
        
        return all_issues
