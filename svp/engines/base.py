from abc import ABC, abstractmethod
from typing import List
from svp.models.context import ProjectContext
from svp.models.issue import Issue
from svp.models.enums import Severity, IssueCategory, Engine

class BaseTool(ABC):
    """
    The foundation for all VeriX analysis tools.
    Ensures every tool provides a standardized interface for the Runner.
    """
    name: str
    engine_type: str
    executable: str
    
    @abstractmethod
    def get_command(self, context: ProjectContext) -> List[str]:
        """Returns the shell command to execute the tool."""
        pass

    @abstractmethod
    def parse_output(self, context: ProjectContext, stdout: str) -> List[Issue]:
        """Parses the raw tool output into standardized Issue objects."""
        pass

    def execute(self, context: ProjectContext) -> List[Issue]:
        """
        Executes the tool via a system call and parses the output.
        Handles missing tools gracefully.
        """
        import subprocess
        
        if not self.check_installed():
            return [Issue(
                engine=Engine.STATIC,
                reported_by=[self.name], 
                category=IssueCategory.SCAN,
                severity=Severity.HIGH, 
                title=f"Tool Missing: {self.executable}",
                description=f"The tool {self.executable} is not installed in the environment.",
                confidence=100
            )]
        
        try:
            cmd = self.get_command(context)
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            return self.parse_output(context, result.stdout)
        except subprocess.TimeoutExpired:
            return [Issue(
                engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.RUNTIME,
                severity=Severity.HIGH, title=f"Tool Timeout: {self.name}",
                description=f"{self.name} exceeded the 300s timeout limit.",
                confidence=100
            )]
        except Exception as e:
            return [Issue(
                engine=Engine.STATIC, reported_by=[self.name], category=IssueCategory.RUNTIME,
                severity=Severity.HIGH, title=f"Tool Crash: {self.name}",
                description=f"Unexpected error: {str(e)}",
                confidence=100
            )]

    def check_installed(self) -> bool:
        """Checks if the executable exists in the system path."""
        import shutil
        return shutil.which(self.executable) is not None
