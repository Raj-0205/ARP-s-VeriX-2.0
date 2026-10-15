import subprocess
import shutil
from dataclasses import dataclass
from typing import Optional

@dataclass
class ProcessResult:
    stdout: str
    stderr: str
    returncode: int
    timeout: bool = False
    error: Optional[str] = None

class ProcessRunner:
    """Centralized process manager to prevent hangs and handle encodings cleanly."""
    
    @staticmethod
    def is_installed(tool_name: str) -> bool:
        """Checks if a CLI tool is available in the system PATH."""
        return shutil.which(tool_name) is not None

    @staticmethod
    def run(cmd: list[str], timeout: int = 300) -> ProcessResult:
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
            return ProcessResult(stdout=res.stdout, stderr=res.stderr, returncode=res.returncode)
        
        except subprocess.TimeoutExpired:
            return ProcessResult(stdout="", stderr="", returncode=-1, timeout=True, error=f"Timeout after {timeout}s")
            
        except Exception as e:
            return ProcessResult(stdout="", stderr="", returncode=-1, error=str(e))
