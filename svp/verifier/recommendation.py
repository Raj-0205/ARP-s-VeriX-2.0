from dataclasses import replace
from svp.models.issue import Issue

class RecommendationEngine:
    """Maps Tool rules to actionable developer recommendations."""
    
    RULES_DB = {
        "B608": "Use parameterized queries (e.g., execute('... WHERE id=?', (uid,))) instead of f-strings or string concatenation.",
        "B101": "Use assert only in tests. Do not use it for application logic, as assertions can be stripped in optimized environments (-O).",
        "B105": "Remove hardcoded passwords. Use environment variables or a secure vault (e.g., AWS Secrets Manager, .env).",
        "B501": "Do not bypass SSL certificate verification (verify=False). This exposes the app to Man-in-the-Middle (MitM) attacks."
    }
    
    @staticmethod
    def enrich(issue: Issue) -> Issue:
        if issue.rule_id and issue.rule_id in RecommendationEngine.RULES_DB:
            return replace(issue, suggested_fix=RecommendationEngine.RULES_DB[issue.rule_id])
        return issue
