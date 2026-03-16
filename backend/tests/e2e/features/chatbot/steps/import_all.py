"""
Behave 1.3.3 step loader proxy.
Behave only loads *.py at top level of steps/. This file recursively
imports all step modules from subdirectories so behave can register them.
"""
import importlib.util
import os
from pathlib import Path

_STEPS_DIR = Path(__file__).parent

for _root, _dirs, _files in os.walk(_STEPS_DIR):
    _dirs.sort()
    for _fname in sorted(_files):
        if not _fname.endswith(".py") or _fname.startswith("_"):
            continue
        _fpath = Path(_root) / _fname
        if _fpath == Path(__file__):
            continue
        _spec = importlib.util.spec_from_file_location(
            f"_step_{_fpath.stem}_{abs(hash(str(_fpath)))}",
            _fpath,
        )
        _mod = importlib.util.module_from_spec(_spec)
        _spec.loader.exec_module(_mod)
