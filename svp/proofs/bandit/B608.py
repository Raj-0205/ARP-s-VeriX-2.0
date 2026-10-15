from svp.models.issue import Proof, ProofCheck
from svp.models.enums import VerificationStatus

def verify(source_line: str, rule_id: str) -> Proof:
    line = source_line.upper()
    checks = []
    
    # Check 1: String formatting
    has_formatting = "F\"" in line or "F'" in line or ".FORMAT(" in line or "%" in line
    checks.append(ProofCheck(
        check="Check for dynamic string formatting/interpolation",
        result="PASS" if has_formatting else "FAIL",
        explanation="Detected string interpolation syntax" if has_formatting else "No formatting found"
    ))
    
    # Check 2: Execute method
    has_execute = "EXECUTE(" in line or "EXECUTEMANY(" in line
    checks.append(ProofCheck(
        check="Check for DB execution method",
        result="PASS" if has_execute else "FAIL",
        explanation="Detected execute() call" if has_execute else "No execute() call found"
    ))
    
    # Check 3: SQL Keywords
    has_sql = any(kw in line for kw in ["SELECT ", "UPDATE ", "INSERT ", "DELETE "])
    checks.append(ProofCheck(
        check="Check for SQL keywords",
        result="PASS" if has_sql else "FAIL",
        explanation="Detected SQL syntax" if has_sql else "No SQL keywords found"
    ))
    
    # If all critical checks pass, SVP verifies the bug. Else, it marks it as a False Positive.
    is_verified = has_formatting and has_execute and has_sql
    status = VerificationStatus.PASS if is_verified else VerificationStatus.FAIL
    
    return Proof(rule=rule_id, checks=checks, status=status)
