from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .enums import Severity, IssueCategory, Engine, IssueStatus
import hashlib

def generate_issue_id(engine: str, reported_by: List[str], rule_id: Optional[str], file_path: Optional[str], line_number: Optional[int]) -> str:
    """Generates a professional VRX- prefixed unique ID."""
    raw_str = f"{engine}{''.join(reported_by)}{rule_id}{file_path}{line_number}"
    hash_val = hashlib.sha256(raw_str.encode()).hexdigest().upper()
    return f"VRX-{hash_val[:8]}"

@dataclass(slots=True, frozen=True)
class Issue:
    engine: Engine                 
    reported_by: List[str]            
    category: IssueCategory             
    severity: Severity             
    title: str
    description: str
    confidence: int
    
    rule_id: Optional[str] = None
    status: IssueStatus = IssueStatus.NEW
    detected_at: datetime = field(default_factory=datetime.now)
    
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    
    evidence: List[str] = field(default_factory=list)
    suggested_fix: Optional[str] = None
    references: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    issue_id: str = field(init=False)

    def __post_init__(self):
        # Ensure confidence is between 0-100
        valid_confidence = max(0, min(100, self.confidence))
        object.__setattr__(self, 'confidence', valid_confidence)
        
        # Generate the VRX- ID
        fid = generate_issue_id(
            engine=self.engine.value,
            reported_by=self.reported_by,
            rule_id=self.rule_id,
            file_path=self.file_path,
            line_number=self.line_number
        )
        object.__setattr__(self, 'issue_id', fid)

    def to_dict(self) -> dict:
        return {
            "issue_id": self.issue_id,
            "engine": self.engine.value,
            "reported_by": self.reported_by,
            "category": self.category.value,
            "severity": self.severity.value,
            "rule_id": self.rule_id,
            "title": self.title,
            "description": self.description,
            "confidence": self.confidence,
            "status": self.status.value,
            "detected_at": self.detected_at.isoformat(),
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column_number": self.column_number,
            "evidence": self.evidence,
            "suggested_fix": self.suggested_fix,
            "references": self.references,
            "metadata": self.metadata
        }
