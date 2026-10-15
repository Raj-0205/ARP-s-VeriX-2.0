from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
from .issue import Issue
from .context import ProjectContext

@dataclass(slots=True)
class ScanResult:
    project_context: ProjectContext
    issues: List[Issue] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

    def get_statistics(self) -> Dict[str, Any]:
        stats = {
            "TOTAL_ISSUES": len(self.issues),
            "by_severity": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0},
            "by_engine": {},
            "by_category": {}
        }
        for issue in self.issues:
            stats["by_severity"][issue.severity.value] += 1
            
            e_val = issue.engine.value
            stats["by_engine"][e_val] = stats["by_engine"].get(e_val, 0) + 1
            
            c_val = issue.category.value
            stats["by_category"][c_val] = stats["by_category"].get(c_val, 0) + 1
            
        return stats

    def to_dict(self) -> dict:
        return {
            "scan_info": {
                "start_time": self.start_time.isoformat(),
                "end_time": self.end_time.isoformat() if self.end_time else None,
                "duration_seconds": round(self.duration_seconds, 2)
            },
            "project": self.project_context.to_dict(),
            "summary": self.get_statistics(),
            "issues": [issue.to_dict() for issue in self.issues]
        }
