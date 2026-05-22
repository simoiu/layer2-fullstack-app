#!/usr/bin/env python3
"""Grade brief-creator skill evaluation outputs."""

import json
import os
import re
import sys
from pathlib import Path


def count_markdown_lines(file_path):
    """Count non-empty lines in a markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = [line for line in f.readlines() if line.strip()]
    return len(lines)


def count_tables(content):
    """Count markdown tables (lines starting with |)."""
    table_lines = [line for line in content.split('\n') if line.strip().startswith('|')]
    # A table needs at least 3 lines (header, separator, content)
    # Count distinct table blocks
    tables = 0
    in_table = False
    for line in content.split('\n'):
        if line.strip().startswith('|'):
            if not in_table:
                tables += 1
                in_table = True
        else:
            in_table = False
    return tables


def has_references_section(content):
    """Check if there's a References section with URLs."""
    # Look for ## References or # References
    if not re.search(r'^##?\s+References', content, re.MULTILINE | re.IGNORECASE):
        return False
    # Check for URLs after the references section
    refs_section = re.split(r'^##?\s+References', content, flags=re.MULTILINE | re.IGNORECASE)[-1]
    return bool(re.search(r'https?://', refs_section))


def grade_eval1(output_dir, eval_metadata):
    """Grade eval-1: prompt engineering brief creation."""
    results = []

    # Find the brief file
    output_files = list(Path(output_dir).glob('*.md'))

    # Assertion 1: brief_file_exists
    brief_exists = len(output_files) > 0
    results.append({
        "text": "The markdown brief file was created in the outputs directory",
        "passed": brief_exists,
        "evidence": f"Found {len(output_files)} markdown file(s)" if brief_exists else "No markdown files found"
    })

    if not brief_exists:
        # Can't check other assertions without a file
        for assertion in eval_metadata['assertions'][1:]:
            results.append({
                "text": assertion['description'],
                "passed": False,
                "evidence": "Cannot check: no output file found"
            })
        return results

    brief_file = output_files[0]
    with open(brief_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Assertion 2: line_count_under_100
    line_count = count_markdown_lines(brief_file)
    under_100 = line_count <= 100
    results.append({
        "text": "The brief has 100 lines or fewer (Layer 2 standard)",
        "passed": under_100,
        "evidence": f"Line count: {line_count}"
    })

    # Assertion 3: contains_tables
    table_count = count_tables(content)
    has_tables = table_count >= 2
    results.append({
        "text": "The brief contains at least 2 markdown tables (table-heavy format)",
        "passed": has_tables,
        "evidence": f"Found {table_count} table(s)"
    })

    # Assertion 4: has_references_section
    has_refs = has_references_section(content)
    results.append({
        "text": "The brief has a References section with actual URLs",
        "passed": has_refs,
        "evidence": "References section with URLs found" if has_refs else "No References section with URLs"
    })

    # Assertion 5: covers_required_topics
    has_techniques = bool(re.search(r'techniqu|prompt', content, re.IGNORECASE))
    has_mistakes = bool(re.search(r'mistake|avoid|error|pitfall', content, re.IGNORECASE))
    has_code_gen = bool(re.search(r'code|generat|implement', content, re.IGNORECASE))
    covers_topics = has_techniques and has_mistakes and has_code_gen
    results.append({
        "text": "The brief covers prompting techniques, common mistakes, and code generation guidance",
        "passed": covers_topics,
        "evidence": f"Techniques: {has_techniques}, Mistakes: {has_mistakes}, Code gen: {has_code_gen}"
    })

    return results


def grade_eval2(output_dir, eval_metadata):
    """Grade eval-2: review existing brief."""
    results = []

    # Find the review file
    output_files = list(Path(output_dir).glob('*.md'))

    # Assertion 1: review_file_exists
    review_exists = len(output_files) > 0
    results.append({
        "text": "A review report markdown file was created in the outputs directory",
        "passed": review_exists,
        "evidence": f"Found {len(output_files)} markdown file(s)" if review_exists else "No markdown files found"
    })

    if not review_exists:
        for assertion in eval_metadata['assertions'][1:]:
            results.append({
                "text": assertion['description'],
                "passed": False,
                "evidence": "Cannot check: no output file found"
            })
        return results

    review_file = output_files[0]
    with open(review_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Assertion 2: checks_line_count
    checks_lines = bool(re.search(r'line.{0,20}count|100.{0,20}line|60.{0,20}line', content, re.IGNORECASE))
    results.append({
        "text": "The review mentions or checks the line count against the 100-line limit",
        "passed": checks_lines,
        "evidence": "Line count check found" if checks_lines else "No line count check found"
    })

    # Assertion 3: identifies_table_issues
    identifies_tables = bool(re.search(r'table|prose|paragraph', content, re.IGNORECASE))
    results.append({
        "text": "The review identifies that the brief uses prose instead of tables (key Layer 2 violation)",
        "passed": identifies_tables,
        "evidence": "Mentions table/prose issues" if identifies_tables else "No table issues identified"
    })

    # Assertion 4: requests_specific_urls
    requests_urls = bool(re.search(r'URL|link|reference.*http|specific.*source', content, re.IGNORECASE))
    results.append({
        "text": "The review mentions that references need actual URLs, not generic descriptions",
        "passed": requests_urls,
        "evidence": "Mentions URL/reference issues" if requests_urls else "No URL issues mentioned"
    })

    # Assertion 5: provides_structured_feedback
    has_structure = bool(re.search(r'##\s+(Critical|High|Priority|Issue|Recommend)', content, re.MULTILINE))
    results.append({
        "text": "The review provides organized feedback with priority levels or clear sections",
        "passed": has_structure,
        "evidence": "Structured feedback sections found" if has_structure else "No clear structure found"
    })

    return results


def grade_eval3(output_dir, eval_metadata):
    """Grade eval-3: Docker vs K8s comparison brief."""
    results = []

    # Find the brief file
    output_files = list(Path(output_dir).glob('*.md'))

    # Assertion 1: brief_file_exists
    brief_exists = len(output_files) > 0
    results.append({
        "text": "The markdown brief file was created in the outputs directory",
        "passed": brief_exists,
        "evidence": f"Found {len(output_files)} markdown file(s)" if brief_exists else "No markdown files found"
    })

    if not brief_exists:
        for assertion in eval_metadata['assertions'][1:]:
            results.append({
                "text": assertion['description'],
                "passed": False,
                "evidence": "Cannot check: no output file found"
            })
        return results

    brief_file = output_files[0]
    with open(brief_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Assertion 2: line_count_reasonable (allow up to 120 for comparison content)
    line_count = count_markdown_lines(brief_file)
    reasonable_length = line_count <= 120
    results.append({
        "text": "The brief is concise (ideally ≤100 lines, allowing some flexibility for comparison content)",
        "passed": reasonable_length,
        "evidence": f"Line count: {line_count}"
    })

    # Assertion 3: contains_comparison_tables
    table_count = count_tables(content)
    has_tables = table_count >= 2
    results.append({
        "text": "The brief contains at least 2 comparison tables showing Docker Compose vs Kubernetes",
        "passed": has_tables,
        "evidence": f"Found {table_count} table(s)"
    })

    # Assertion 4: has_references_section
    has_refs = has_references_section(content)
    results.append({
        "text": "The brief has a References section with source links",
        "passed": has_refs,
        "evidence": "References section with URLs found" if has_refs else "No References section with URLs"
    })

    # Assertion 5: provides_decision_guidance
    has_docker = bool(re.search(r'docker.?compose', content, re.IGNORECASE))
    has_k8s = bool(re.search(r'kubernetes|k8s', content, re.IGNORECASE))
    has_decision = bool(re.search(r'when to use|choose|decision|should you', content, re.IGNORECASE))
    provides_guidance = has_docker and has_k8s and has_decision
    results.append({
        "text": "The brief includes guidance on when to use Docker Compose vs Kubernetes",
        "passed": provides_guidance,
        "evidence": f"Docker: {has_docker}, K8s: {has_k8s}, Decision guidance: {has_decision}"
    })

    return results


def main():
    if len(sys.argv) != 3:
        print("Usage: grade_brief_eval.py <run_dir> <eval_id>")
        sys.exit(1)

    run_dir = sys.argv[1]
    eval_id = int(sys.argv[2])

    # Find eval_metadata.json in parent directory
    parent_dir = Path(run_dir).parent
    metadata_file = parent_dir / 'eval_metadata.json'

    with open(metadata_file, 'r') as f:
        eval_metadata = json.load(f)

    output_dir = Path(run_dir) / 'outputs'

    # Grade based on eval_id
    if eval_id == 1:
        results = grade_eval1(output_dir, eval_metadata)
    elif eval_id == 2:
        results = grade_eval2(output_dir, eval_metadata)
    elif eval_id == 3:
        results = grade_eval3(output_dir, eval_metadata)
    else:
        print(f"Unknown eval_id: {eval_id}")
        sys.exit(1)

    # Calculate pass rate
    passed = sum(1 for r in results if r['passed'])
    total = len(results)

    grading = {
        "eval_id": eval_id,
        "expectations": results,
        "pass_rate": passed / total if total > 0 else 0,
        "passed_count": passed,
        "total_count": total
    }

    # Save grading.json
    grading_file = Path(run_dir) / 'grading.json'
    with open(grading_file, 'w') as f:
        json.dump(grading, f, indent=2)

    print(f"Graded {run_dir}: {passed}/{total} passed ({grading['pass_rate']:.1%})")


if __name__ == '__main__':
    main()
