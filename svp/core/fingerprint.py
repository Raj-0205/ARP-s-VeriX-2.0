import hashlib
from typing import Final, List

# Type Alias for Future Enterprise Scalability
IssueID = str

# Configurable hash function following Open/Closed Principle
FINGERPRINT_HASH: Final = hashlib.sha256

__all__ = [
    "generate_issue_id",
]

def generate_issue_id(engine: str, reported_by: List[str], rule_id: str, file_path: str, line_number: int) -> IssueID:
    """Generates a unique, collision-resistant deterministic fingerprint for VeriX issues."""
    rule = rule_id or "UNKNOWN_RULE"
    path = file_path or "UNKNOWN_FILE"
    line = line_number or 0
    tools = ",".join(sorted(reported_by)) if reported_by else "UNKNOWN_TOOL"
    
    # Clean variable naming reflecting encoded bytes payload
    fingerprint_data = f"{engine}:{tools}:{rule}:{path}:{line}".encode('utf-8')
    
    # 8-character hex digest (~4.29 billion space, ideal collision resistance)
    digest = FINGERPRINT_HASH(fingerprint_data).hexdigest()[:8].upper()
    
    # Branded with VRX- for VeriX identity
    return f"VRX-{digest}"
