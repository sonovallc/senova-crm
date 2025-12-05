#!/usr/bin/env python3
"""Fix all API endpoint paths by removing /api prefix since it's already in base URL"""

import os
import re
from pathlib import Path

def fix_api_endpoints(root_dir):
    """Replace all '/api/v1' with '/v1' in TypeScript files"""

    # Pattern to match '/api/v1' in strings
    pattern = r'(["\'])/api/v1/'
    replacement = r'\1/v1/'

    files_fixed = []

    # Walk through all TypeScript files
    for filepath in Path(root_dir).rglob('*.ts'):
        fix_file(filepath, pattern, replacement, files_fixed)

    for filepath in Path(root_dir).rglob('*.tsx'):
        fix_file(filepath, pattern, replacement, files_fixed)

    return files_fixed

def fix_file(filepath, pattern, replacement, files_fixed):
    """Fix a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file contains the pattern
        if re.search(pattern, content):
            # Replace all occurrences
            new_content = re.sub(pattern, replacement, content)

            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            files_fixed.append(str(filepath))
            print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    # Fix frontend source files
    frontend_src = r"C:\Users\jwood\Documents\Projects\claude-code-agents-wizard-v2\context-engineering-intro\frontend\src"

    print("Fixing API endpoints in frontend source files...")
    fixed_files = fix_api_endpoints(frontend_src)

    print(f"\nFixed {len(fixed_files)} files:")
    for f in fixed_files[:10]:  # Show first 10
        print(f"  - {f}")
    if len(fixed_files) > 10:
        print(f"  ... and {len(fixed_files) - 10} more files")

    print("\nDone! All '/api/v1' patterns have been replaced with '/v1'")