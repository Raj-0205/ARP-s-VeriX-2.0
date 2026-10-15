from enum import Enum

class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class IssueCategory(Enum):
    SCAN = "SCAN"
    STATIC = "STATIC"
    SECURITY = "SECURITY"
    RUNTIME = "RUNTIME"
    PERFORMANCE = "PERFORMANCE"
    ARCHITECTURE = "ARCHITECTURE"

class Engine(Enum):
    SCANNER = "SCANNER"
    STATIC = "STATIC"
    SECURITY = "SECURITY"
    RUNTIME = "RUNTIME"
    PERFORMANCE = "PERFORMANCE"

class IssueStatus(Enum):
    NEW = "NEW"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    FIXED = "FIXED"
    IGNORED = "IGNORED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
