from __future__ import annotations

import copy
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
}
for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)
ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

ROOT = Path('/Users/vn105957/Desktop/odt-submission')
TEMPLATE = Path('/Users/vn105957/Downloads/DigitalWorkerName_CategoryName_PPT_Submission_v1.pptx')
OUTPUT = ROOT / 'docs' / 'Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx'

SLIDE_UPDATES = {
    'ppt/slides/slide1.xml': {
        2: ['Oracle Developer Twin'],
        3: ['Individual Submission'],
        4: ['Vijay N.'],
        5: ['Governed Digital Worker for Software Delivery'],
        6: ['Submission Category: Digital Worker using OCA'],
    },
    'ppt/slides/slide2.xml': {
        2: ['Oracle Developer Twin (ODT)'],
        3: [
            'Problem Statement:',
            'Developers still spend manual time translating tickets into repo impact, test scope, accessibility obligations, and reliable execution prompts before coding can safely begin.',
        ],
        4: [
            'Solution – Digital Worker:',
            'ODT turns one work item into a seven-stage, repo-aware, review-ready workflow with durable artifacts, dashboards, and governed delegation to an OCA-backed execution session.',
        ],
        5: [
            'Expected Outcomes or Improvements',
            'Impact: faster planning, more consistent review, earlier accessibility visibility, and cleaner handoff to coding agents.',
            'Measurable KPIs: planning prep time reduced, review-ready artifact coverage increased, a11y issues found earlier, and fewer unsafe agent launches.',
        ],
        6: [
            'Who faces this problem?',
            'Frontend developers, tech leads, reviewers, delivery managers, and teams adopting AI-assisted software delivery.',
        ],
    },
    'ppt/slides/slide3.xml': {
        2: [
            'What the Digital Worker does',
            'A governed SDLC co-worker that prepares impact, design, code, test, and compliance guidance from a single requirement.',
            'It assists with ticket intake, repo analysis, prompt hardening, workpack creation, and execution handoff.',
            'It improves the workflow between ticket -> plan -> review -> delegate -> approve.',
            'Human review is included before re-analysis, before delegation, and before merge.',
        ],
        3: ['Ticket intake -> prompt hardening -> repo impact -> design/code/tests/compliance -> human review -> OCA delegation -> repo diff approval'],
        4: ['Oracle Developer Twin'],
        5: [
            'Why it stands out',
            'Unique Value Proposition',
            'ODT turns hidden setup work into a visible, governed delivery flow around OCA. It is not just code generation; it explains impact, preserves review, and makes AI safer to adopt.',
        ],
        6: ['Digital Worker Flow'],
    },
    'ppt/slides/slide4.xml': {
        1: ['High-level architecture, OCA execution path, OCI prompt option, and governed human review.'],
        2: ['Technical Architecture'],
        3: ['Input layer: ticket, repo, mockups, reviewer notes • Planning engine: intake, impact, design, code, tests, compliance • Control plane: local context server and ODT dashboards • AI layer: OCA-backed execution with OCI GenAI optional for stage prompts • Human gate: reviewer edits, re-analysis, repo diff approval'],
    },
    'ppt/slides/slide5.xml': {
        1: ['How This Digital Worker Works'],
        3: ['Operational Detail'],
        5: [
            'Who uses ODT and where value is realized',
            'A developer enters the work item, chooses the repo, reviews the evidence, and delegates only when ready. A reviewer or lead can add edits and request re-analysis.',
            'Execution model',
            'ODT plans and governs; OCA-backed Codex or Cline sessions execute implementation against the target repo.',
            'Guardrails and governance',
            'Prompt hardening, repo validation, optional Git initialization, accessibility evidence, and mandatory human approval before merge.',
            'Interaction flow',
            'Requirement -> ODT Workspace -> reports/odt artifacts -> execute prompt -> OCA session -> repo diff review.',
            'Integration points',
            'Node.js CLI engine, local context server, generated dashboards, demo React app, OCI prompt-provider option, and OCA execution path.',
            'Why judges should care',
            'ODT makes AI delivery explainable, reviewable, and demo-ready today.',
        ],
    },
    'ppt/slides/slide6.xml': {
        1: ['Digital Worker'],
        2: [
            'Business impact',
            'Cuts planning overhead, improves review consistency, surfaces accessibility earlier, and gives teams a reusable Oracle delivery pattern.',
        ],
        3: [
            'Responsible AI',
            'Human-in-the-loop review is mandatory; prompts and artifacts are traceable; fallback behavior keeps the flow safe when OCI is unavailable.',
        ],
        4: [
            'Demo summary',
            'The demo shows intake, seven-stage planning, dashboard evidence, reviewer edits, OCA delegation, and final repo-level human approval.',
        ],
        5: ['Summary'],
        6: [
            'Closing takeaway',
            'Oracle Developer Twin turns OCA into a governed Digital Worker for software delivery by making the work before coding visible, structured, and review-ready.',
        ],
    },
}


def update_shape_text(sp: ET.Element, values: list[str]) -> None:
    text_nodes = sp.findall('.//a:t', NS)
    if not text_nodes:
        return
    for idx, node in enumerate(text_nodes):
        node.text = values[idx] if idx < len(values) else ''


def update_slide(xml_bytes: bytes, shape_updates: dict[int, list[str]]) -> bytes:
    root = ET.fromstring(xml_bytes)
    shapes = root.findall('.//p:sp', NS)
    for shape_index, values in shape_updates.items():
        if shape_index - 1 < len(shapes):
            update_shape_text(shapes[shape_index - 1], values)
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(TEMPLATE, 'r') as zin, zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename in SLIDE_UPDATES:
            data = update_slide(data, SLIDE_UPDATES[item.filename])
        zout.writestr(item, data)

print(OUTPUT)
