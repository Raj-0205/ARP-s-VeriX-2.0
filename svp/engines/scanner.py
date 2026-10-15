
import os
import sys
import platform
from pathlib import Path
from typing import Set
from svp.models.context import ProjectContext

class ProjectScanner:
    def __init__(self, target_dir: str):
        self.root_path = Path(target_dir).resolve()
        self.ignored_dirs: Set[str] = {
            '.git', '__pycache__', 'venv', '.venv', 'env', '.env',
            'node_modules', '.idea', '.vscode', 'build', 'dist', '.tox',
            '.pytest_cache', '.mypy_cache', '.ruff_cache', 'coverage', 'htmlcov'
        }
        self.ignored_files: Set[str] = {'.gitignore', '.dockerignore'}
        
    def scan(self) -> ProjectContext:
        if not self.root_path.exists() or not self.root_path.is_dir():
            raise FileNotFoundError(f"Directory not found: {self.root_path}")

        context = ProjectContext(
            root_dir=str(self.root_path),
            project_name=self.root_path.name,
            os=platform.system(),
            python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            has_git=(self.root_path / '.git').exists(),
            has_venv=any((self.root_path / v).is_dir() for v in ['venv', '.venv', 'env', '.env'])
        )

        req_files = {'requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'}
        entry_candidates = {'main.py', 'app.py', 'manage.py', 'run.py', 'wsgi.py', 'asgi.py'}

        for root, dirs, files in os.walk(self.root_path):
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs]
            
            for file in files:
                if file in self.ignored_files:
                    continue
                    
                context.total_files += 1
                file_path = os.path.join(root, file)
                ext = Path(file).suffix.lower()

                # Classification
                if ext == '.py':
                    context.file_types["python"] += 1
                    context.python_files.append(file_path)
                    if file in entry_candidates:
                        context.entry_points.append(file_path)
                elif ext == '.json': context.file_types["json"] += 1
                elif ext in ['.yaml', '.yml']: context.file_types["yaml"] += 1
                elif ext == '.md': context.file_types["markdown"] += 1
                elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico']: context.file_types["images"] += 1
                elif ext in ['.sqlite', '.db', '.sqlite3']: context.file_types["databases"] += 1
                elif ext in ['.exe', '.sh', '.bat', '.bin']: context.file_types["executables"] += 1
                else: context.file_types["others"] += 1
                
                # Requirements
                if file in req_files:
                    context.requirements_files.append(file_path)

        context.ignored_paths = list(self.ignored_dirs)
        return context
