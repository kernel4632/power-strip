"""Compatibility entry point. Both source workbooks are required."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("import-workbooks.py")), run_name="__main__")
