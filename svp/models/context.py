from dataclasses import dataclass, field
from typing import List, Dict

@dataclass(slots=True)
class ProjectContext:
    root_dir: str
    project_name: str = "Unknown"
    os: str = "Unknown"
    python_version: str = "Unknown"
    
    has_git: bool = False
    has_venv: bool = False
    
    # Detailed File Categorization
    total_files: int = 0
    file_types: Dict[str, int] = field(default_factory=lambda: {
        "python": 0, "json": 0, "yaml": 0, "markdown": 0, 
        "images": 0, "databases": 0, "executables": 0, "others": 0
    })
    
    ignored_paths: List[str] = field(default_factory=list)
    entry_points: List[str] = field(default_factory=list)
    python_files: List[str] = field(default_factory=list)
    requirements_files: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "project_name": self.project_name,
            "root_dir": self.root_dir,
            "os": self.os,
            "python_version": self.python_version,
            "has_git": self.has_git,
            "has_venv": self.has_venv,
            "total_files": self.total_files,
            "file_types": self.file_types,
            "entry_points_count": len(self.entry_points)
        }
