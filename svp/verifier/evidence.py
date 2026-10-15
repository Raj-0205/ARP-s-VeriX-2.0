import os
from dataclasses import replace
from svp.models.issue import Issue

class EvidenceExtractor:
    """Extracts actual code snippet with +/- lines of context."""
    
    def enrich(self, issue: Issue, context_before: int = 2, context_after: int = 2) -> Issue:
        if not issue.file_path or not issue.line_number or not os.path.exists(issue.file_path):
            return issue

        try:
            with open(issue.file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                target_idx = issue.line_number - 1
                if target_idx < 0 or target_idx >= len(lines):
                    return issue

                start_idx = max(0, target_idx - context_before)
                end_idx = min(len(lines) - 1, target_idx + context_after)
                
                snippet = []
                for i in range(start_idx, end_idx + 1):
                    line_content = lines[i].rstrip('\n')
                    # Professional formatting: "069 >> | code"
                    prefix = ">> " if i == target_idx else "   "
                    snippet.append(f"{i+1:03d} {prefix}| {line_content}")
                    
                if snippet:
                    return replace(issue, evidence=snippet)
        except Exception:
            pass 
            
        return issue
