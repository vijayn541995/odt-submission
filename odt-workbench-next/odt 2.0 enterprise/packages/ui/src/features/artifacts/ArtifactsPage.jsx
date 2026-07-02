import React, { useEffect, useState } from 'react';
import {
  activeAssignmentId,
  activeWorkKey,
  buildAiWorkAuditPack,
  currentEvidenceItems,
  currentPrReadinessReports
} from '@odt/domain';
import {
  InfoList,
  JsonBlock,
  PageHeader,
  Panel,
  SimpleTable,
  StatusBadge
} from '../../primitives/index.js';
import {
  formatBytes,
  formatTime,
  shortId,
  titleCase
} from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`ArtifactsPage requires ${name}`);
  }
  return value;
}

export function ArtifactsPage({
  data,
  apiBase,
  assetFileUrl
}) {
  const buildAssetFileUrl = requireDependency(assetFileUrl, 'assetFileUrl');
  const assignmentId = activeAssignmentId(data);
  const workKey = activeWorkKey(data);
  const evidence = data.evidence || {};
  const currentTechnicalDesigns = currentEvidenceItems(evidence, 'technicalDesigns');
  const currentImplementationPlans = currentEvidenceItems(evidence, 'implementationPlans');
  const currentAuditPacks = currentEvidenceItems(evidence, 'aiWorkAuditPacks');
  const currentPrReports = currentPrReadinessReports(evidence);
  const currentImplementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence');
  const currentAssets = currentEvidenceItems(evidence, 'intakeAssets');
  const currentWorkerRuns = currentEvidenceItems(evidence, 'agentWorkerRuns');
  const currentRelayItems = currentEvidenceItems(evidence, 'agentRelayItems');
  const currentFoundryRuns = currentEvidenceItems(evidence, 'agentFoundryRuns');
  const currentAgentEvents = currentEvidenceItems(evidence, 'agentEvents');
  const currentReviewComments = currentEvidenceItems(evidence, 'reviewComments');
  const currentStandardsChecks = currentEvidenceItems(evidence, 'standardsChecks');
  const currentApprovals = currentEvidenceItems(evidence, 'approvals');
  const currentDependencyRequests = currentEvidenceItems(evidence, 'dependencyRequests');
  const branchReadiness = data.agentContract?.projectReadiness?.checks?.find((check) => check.id === 'branch-readiness') || null;
  const latestAuditPackRecord = currentAuditPacks[0] || null;
  const aiWorkAuditPack = latestAuditPackRecord
    ? {
        ...latestAuditPackRecord.packJson,
        artifactId: latestAuditPackRecord.id,
        snapshotStage: latestAuditPackRecord.stage,
        snapshotStatus: latestAuditPackRecord.status,
        persistedAt: latestAuditPackRecord.createdAt
      }
    : buildAiWorkAuditPack({ data, branchReadiness });
  const latestDesign = currentTechnicalDesigns[0]?.designJson;
  const latestPlan = currentImplementationPlans[0]?.planJson;
  const latestPrPack = currentPrReports[0]?.reportJson;
  const implementationEvidence = currentImplementationEvidence;
  const latestImplementationEvidence = implementationEvidence[0];
  const assets = currentAssets;
  const workerRuns = currentWorkerRuns;
  const relayItems = currentRelayItems;
  const agentFoundryRuns = currentFoundryRuns;
  const latestFoundryRunId = agentFoundryRuns[0]?.runId || '';
  const latestFoundryEntries = latestFoundryRunId ? agentFoundryRuns.filter((entry) => entry.runId === latestFoundryRunId) : [];
  const latestFoundryArtifactEntries = latestFoundryEntries.map((entry) => ({
    id: entry.id,
    runId: entry.runId,
    phase: entry.phase,
    domainId: entry.domainId,
    domainLabel: entry.domainLabel,
    status: entry.status,
    provider: entry.provider,
    model: entry.model,
    createdAt: entry.createdAt,
    inputSources: entry.inputSources,
    output: entry.output
  }));
  const latestAgentWorker = currentAgentEvents.find((event) => event.eventType === 'worker_launch_prepared' || event.eventType === 'worker_launch_failed');
  const latestAgentHandoff = currentAgentEvents.find((event) => event.eventType === 'handoff_prepared');
  const artifactCatalogContent = {
    message: 'Choose an artifact to review its saved evidence.',
    activeAssignmentId: assignmentId,
    workKey: workKey || assignmentId,
    availableEvidence: {
      technicalDesigns: currentTechnicalDesigns.length,
      implementationPlans: currentImplementationPlans.length,
      intakeAssets: assets.length,
      standardsChecks: currentStandardsChecks.length,
      approvals: currentApprovals.length,
      dependencyRequests: currentDependencyRequests.length,
      reviewComments: currentReviewComments.length,
      implementationEvidence: implementationEvidence.length,
      aiWorkAuditPacks: currentAuditPacks.length,
      agentWorkerRuns: workerRuns.length,
      agentRelayItems: relayItems.length,
      agentFoundryRuns: agentFoundryRuns.length,
      agentHandoffs: currentAgentEvents.length,
      prReadinessReports: currentPrReports.length
    }
  };
  const [selectedArtifact, setSelectedArtifact] = useState({
    title: 'Artifact Catalog',
    content: artifactCatalogContent
  });

  useEffect(() => {
    setSelectedArtifact({
      title: 'Artifact Catalog',
      content: artifactCatalogContent
    });
  }, [assignmentId]);

  const artifacts = [
    {
      title: 'Architecture Brief',
      copy: 'Technical design, architecture decisions, accessibility/security notes, and rollback thinking.',
      action: 'View Brief',
      content: latestDesign || { status: 'waiting', message: 'Draft a technical design from Intake or Standards to create this artifact.' }
    },
    {
      title: 'Implementation Blueprint',
      copy: 'Files to change, backend/frontend tasks, validation, tests, risks, and approval gates.',
      action: 'View Blueprint',
      content: latestPlan || { status: 'waiting', message: 'Generate an implementation plan to create this artifact.' }
    },
    {
      title: 'OpenAPI Contract',
      copy: 'Backend API contract for future OCI GenAI Agent tool calling and integration review.',
      action: 'Open Contract',
      content: {
        openApiUrl: `${apiBase}/openapi.json`,
        note: 'Use Open Contract to view the live OpenAPI 3.0.3 document in a new tab.'
      },
      onOpen: () => window.open(`${apiBase}/openapi.json`, '_blank', 'noopener,noreferrer')
    },
    {
      title: 'Run Evidence',
      copy: 'Usage logs, event timeline, provider selection, token counts, latency, and verification notes.',
      action: 'View Run Evidence',
      content: {
        runs: data.runs,
        selectedRunId: data.selectedRunId,
        selectedRunEvents: data.runEvents
      }
    },
    {
      title: 'Review Log',
      copy: 'Human review comments, blocker decisions, accepted risk, rework requests, and resolution notes.',
      action: 'View Review Log',
      content: {
        comments: currentReviewComments,
        openBlockers: currentReviewComments.filter((comment) => comment.status === 'open' && comment.severity === 'blocker'),
        acceptedRisk: currentReviewComments.filter((comment) => comment.status === 'accepted_risk')
      }
    },
    {
      title: 'AI Work Audit Pack',
      copy: 'Who approved what, review comments, gate impact, validation evidence, risks, and Markdown/JSON export.',
      action: 'View Audit Pack',
      content: aiWorkAuditPack
    },
    {
      title: 'Implementation Evidence',
      copy: 'Changed files, commands, test outcomes, post-implementation check status, and PR gate inputs.',
      action: 'View Evidence',
      content: latestImplementationEvidence || { status: 'waiting', message: 'Record implementation evidence from Review after Codex, Cline, or manual work finishes.' }
    },
    {
      title: 'Agent Worker Launch',
      copy: 'Latest Codex worker lane, bundle paths, allowed actions, launch status, response file, log file, and manual fallback command.',
      action: 'View Worker',
      content: latestAgentWorker?.detailJson || latestAgentHandoff?.detailJson || { status: 'waiting', message: 'Launch or delegate from Agent Team to create governed worker evidence.' }
    },
    {
      title: 'Worker Relay Queue',
      copy: 'Sequential worker runs, first-class relay items, parsed outputs, response files, and relay context for the next agent.',
      action: 'View Queue',
      content: {
        orchestration: 'Sequential by default. Parallel writes require file partitioning.',
        relayPolicy: 'Worker run output stays immutable. Cross-lane questions become relay items and are injected into future worker prompts.',
        relayItems,
        workerRuns
      }
    },
    {
      title: 'Agent Foundry Reviews',
      copy: 'Specialist Full SDLC or focused-domain findings, risks, recommendations, approvals, and next actions.',
      action: 'View Foundry',
      content: latestFoundryEntries.length ? {
        runId: latestFoundryRunId,
        label: 'AI-generated suggestion',
        humanReviewRequired: true,
        entries: latestFoundryArtifactEntries
      } : { status: 'waiting', message: 'Run Agent Foundry from Agent Team to create specialist evidence.' }
    },
    {
      title: 'Context Vault',
      copy: 'Copied requirement context: mockups, screenshots, PDFs, DOCX, spreadsheets, API samples, and notes.',
      action: 'View Vault',
      content: {
        storage: data.uploadPolicy?.workspaceDir || data.snapshot?.intake?.workspaceDir,
        policy: data.uploadPolicy?.uploadPolicy || data.snapshot?.intake?.uploadPolicy,
        assets
      }
    },
    {
      title: 'PR Readiness Pack',
      copy: 'Acceptance mapping, testing notes, accessibility notes, security notes, risks, and rollback.',
      action: 'View PR Pack',
      content: latestPrPack || { status: 'waiting', message: 'Prepare a PR Pack from Standards to create this artifact.' }
    }
  ];

  function openArtifact(artifact) {
    artifact.onOpen?.();
    setSelectedArtifact({ title: artifact.title, content: artifact.content });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Artifacts"
        title="Saved outputs and evidence"
        copy="Summaries, JSON contracts, generated test ideas, OpenAPI notes, and review evidence will be collected here."
      />
      <div className="artifact-grid">
        {artifacts.map((artifact) => (
          <Panel title={artifact.title} eyebrow="Artifact" key={artifact.title}>
            <p className="muted-copy">{artifact.copy}</p>
            <button
              type="button"
              className={`secondary-button ${selectedArtifact.title === artifact.title ? 'selected-action' : ''}`}
              onClick={() => openArtifact(artifact)}
              aria-current={selectedArtifact.title === artifact.title ? 'true' : undefined}
            >
              {artifact.action}
            </button>
          </Panel>
        ))}
      </div>
      <Panel title={selectedArtifact.title} eyebrow="Artifact Detail">
        {selectedArtifact.title === 'Context Vault' && assets.length ? (
          <SimpleTable
            columns={['File', 'Context Role', 'Extraction', 'AI/Parser', 'Size', 'Action']}
            rows={assets.map((asset) => [
              asset.originalName,
              assetRoleLabel(asset),
              <StatusBadge label={assetExtractionLabel(asset)} tone={assetExtractionTone(asset)} />,
              <StatusBadge label={assetAiEnrichmentLabel(asset)} tone={assetAiEnrichmentTone(asset)} />,
              formatBytes(asset.bytes),
              <a className="table-button" href={buildAssetFileUrl(asset.id)} target="_blank" rel="noreferrer">Open File</a>
            ])}
          />
        ) : selectedArtifact.title === 'Agent Foundry Reviews' ? (
          <FoundryArtifactDetail content={selectedArtifact.content} />
        ) : selectedArtifact.title === 'AI Work Audit Pack' ? (
          <AuditPackDetail pack={selectedArtifact.content} />
        ) : selectedArtifact.title === 'PR Readiness Pack' && selectedArtifact.content?.markdown ? (
          <pre className="markdown-block">{selectedArtifact.content.markdown}</pre>
        ) : (
          <JsonBlock value={selectedArtifact.content} />
        )}
      </Panel>
    </div>
  );
}

function AuditPackDetail({ pack }) {
  if (!pack || pack.artifactType !== 'ai-work-audit-pack') {
    return <div className="empty-state">No AI work audit pack is available yet.</div>;
  }

  const summary = pack.summary || {};
  const branchReadiness = pack.branchReadiness || {};
  const validation = pack.validation || {};
  const risks = pack.risks || {};

  return (
    <div className="audit-pack-detail">
      <div className="artifact-summary-strip">
        <StatusBadge label={summary.workflowState || 'UNKNOWN'} tone={standardsTone(summary.workflowState)} />
        {pack.snapshotStage ? <StatusBadge label={`Snapshot: ${titleCase(pack.snapshotStage)}`} tone="info" /> : null}
        <StatusBadge label={`Branch: ${titleCase(branchReadiness.status || 'not checked')}`} tone={branchReadiness.status === 'ready' ? 'success' : 'warning'} />
        <StatusBadge label={`${pack.decisions?.length || 0} Decision${pack.decisions?.length === 1 ? '' : 's'}`} tone={pack.decisions?.length ? 'info' : 'warning'} />
        <StatusBadge label={`${pack.reviewComments?.length || 0} Review Comment${pack.reviewComments?.length === 1 ? '' : 's'}`} tone={pack.reviewComments?.length ? 'warning' : 'neutral'} />
      </div>

      <InfoList
        items={[
          ['Assignment', summary.assignmentId || 'Not recorded'],
          ['Work key', summary.workKey || 'Manual / No Jira'],
          ['Repository', summary.repoPath || 'Not recorded'],
          ['Base branch', summary.baseBranch || 'Not recorded'],
          ['Current branch', branchReadiness.currentBranch || 'Not checked'],
          ['Expected branch', branchReadiness.expectedBranch || 'Not required'],
          ['Gate impact', branchReadiness.gateImpact || 'Not evaluated'],
          ['Snapshot id', pack.artifactId ? shortId(pack.artifactId) : 'Derived only'],
          ['Persisted', pack.persistedAt ? formatTime(pack.persistedAt) : 'Not persisted'],
          ['Generated', formatTime(pack.generatedAt)]
        ]}
      />

      <div className="two-column wide-left">
        <section className="audit-pack-section">
          <div className="section-heading">
            <strong>Evidence Links</strong>
            <span className="muted-copy">Audit References</span>
          </div>
          <SimpleTable
            columns={['Evidence', 'Status', 'Detail']}
            rows={(pack.evidenceLinks || []).map((item) => [
              `${item.label} (${shortId(item.id) || item.type})`,
              <StatusBadge label={titleCase(item.status)} tone={standardsTone(item.status)} />,
              item.detail || item.page
            ])}
            empty="No linked evidence recorded yet."
          />
        </section>

        <section className="audit-pack-section">
          <div className="section-heading">
            <strong>Decision / Gate Impact</strong>
            <span className="muted-copy">Who Approved What</span>
          </div>
          <SimpleTable
            columns={['Decision', 'Approver', 'Impact']}
            rows={(pack.decisions || []).map((item) => [
              <span>{item.whatApproved}<small className="cell-note">{titleCase(item.status)} at {formatTime(item.approvedAt)}</small></span>,
              item.approvedBy || 'unknown',
              <span>{item.gateImpact}{item.notes ? <small className="cell-note">{item.notes}</small> : null}</span>
            ])}
            empty="No approval or dependency decision has been recorded yet."
          />
        </section>
      </div>

      <div className="two-column">
        <section className="audit-pack-section">
          <div className="section-heading">
            <strong>Validation</strong>
            <span className="muted-copy">Commands And Tests</span>
          </div>
          <InfoList
            items={[
              ['Implementation evidence', validation.latestImplementationEvidenceId ? shortId(validation.latestImplementationEvidenceId) : 'Not recorded'],
              ['PR pack', validation.latestPrPackId ? shortId(validation.latestPrPackId) : 'Not generated'],
              ['Commands', validation.commands?.length || 0],
              ['Tests', validation.tests?.length || 0],
              ['Failed tests', validation.failedTests?.length || 'None'],
              ['Standards checks', validation.standardsChecks?.length || 0]
            ]}
          />
        </section>

        <section className="audit-pack-section">
          <div className="section-heading">
            <strong>Risks / Approvals</strong>
            <span className="muted-copy">Open Items</span>
          </div>
          <InfoList
            items={[
              ['Open review comments', risks.openReviewComments?.length || 'None'],
              ['Accepted risks', risks.acceptedRisk?.length || 'None'],
              ['Pending dependencies', risks.pendingDependencies?.length || 'None'],
              ['Blocked reasons', risks.blockedReasons?.length || 'None'],
              ['Branch status', titleCase(branchReadiness.status || 'not checked')]
            ]}
          />
        </section>
      </div>

      <section className="audit-pack-section">
        <div className="section-heading">
          <strong>Review Comments</strong>
          <span className="muted-copy">Human Notes</span>
        </div>
        <SimpleTable
          columns={['Target', 'Severity', 'Comment', 'Status']}
          rows={(pack.reviewComments || []).map((comment) => [
            titleCase(comment.targetType),
            <StatusBadge label={titleCase(comment.severity)} tone={standardsTone(comment.severity)} />,
            <span>{comment.comment}{comment.resolutionNotes ? <small className="cell-note">{comment.resolutionNotes}</small> : null}</span>,
            <StatusBadge label={titleCase(comment.status)} tone={standardsTone(comment.status)} />
          ])}
          empty="No review comments recorded yet."
        />
      </section>

      <section className="audit-pack-section">
        <div className="section-heading">
          <strong>Export</strong>
          <span className="muted-copy">Markdown</span>
        </div>
        <pre className="markdown-block">{pack.markdown}</pre>
      </section>

      <section className="audit-pack-section">
        <div className="section-heading">
          <strong>Export JSON</strong>
          <span className="muted-copy">Machine Readable</span>
        </div>
        <pre className="markdown-block">{pack.exportJson}</pre>
      </section>
    </div>
  );
}

function FoundryArtifactDetail({ content }) {
  const entries = content?.entries || [];
  if (!entries.length) {
    return <div className="empty-state">{content?.message || 'Run Agent Foundry from Agent Team to create specialist evidence.'}</div>;
  }

  return (
    <div className="foundry-detail">
      <div className="foundry-summary">
        <div>
          <span className="eyebrow">Evidence Run</span>
          <strong>{shortId(content.runId)}</strong>
        </div>
        <StatusBadge label={content.label || 'AI-generated suggestion'} tone="info" />
        <StatusBadge label={content.humanReviewRequired ? 'Human Review Required' : 'Review Optional'} tone={content.humanReviewRequired ? 'warning' : 'success'} />
        <StatusBadge label={`${entries.length} Specialist${entries.length === 1 ? '' : 's'}`} tone="neutral" />
      </div>

      {entries.map((entry) => {
        const output = entry.output || {};
        const findings = output.findings || [];
        return (
          <section className="foundry-review-card" key={entry.id || `${entry.runId}-${entry.domainId}`}>
            <div className="foundry-review-head">
              <div>
                <span className="eyebrow">{output.specialistLabel || entry.domainLabel || titleCase(entry.domainId)}</span>
                <h4>{output.specialistName || 'Specialist Review'}</h4>
                <p>{output.summary || 'Specialist evidence is ready for review.'}</p>
              </div>
              <StatusBadge label={entry.status || output.status || 'NEEDS_REVIEW'} tone={standardsTone(entry.status || output.status)} />
            </div>

            <InfoList
              items={[
                ['Phase', titleCase(output.phase || entry.phase)],
                ['Provider', output.provider || entry.provider || 'local'],
                ['Model', output.model || entry.model || 'local'],
                ['Created', formatTime(output.createdAt || entry.createdAt)]
              ]}
            />

            <div className="chip-row compact-chips" aria-label="Input sources used for this specialist review">
              {normalizeList(output.inputSources || entry.inputSources).map((source) => (
                <span className="chip" key={source}>{titleCase(source)}</span>
              ))}
            </div>

            <SimpleTable
              columns={['Category', 'Status', 'Finding', 'Recommendation']}
              rows={findings.map((finding) => [
                titleCase(finding.category),
                <StatusBadge label={finding.status || 'NEEDS_REVIEW'} tone={standardsTone(finding.status)} />,
                finding.message,
                finding.recommendation
              ])}
              empty="No findings were generated for this specialist."
            />

            <div className="foundry-evidence-grid">
              <EvidenceList title="Risks" items={output.risks} empty="No high-risk issue detected." />
              <EvidenceList title="Recommendations" items={output.recommendations} empty="No recommendations captured." />
              <EvidenceList title="Missing Information" items={output.missingInformation} empty="No critical missing information detected." />
              <EvidenceList title="Next Actions" items={output.nextActions} empty="No next actions captured." />
            </div>

            <div className="foundry-standards-note">
              <strong>Standards impact</strong>
              <p>{output.standardsImpact?.note || 'Foundry output is advisory evidence and does not approve write, dependency install, or PR readiness gates.'}</p>
              <div className="chip-row compact-chips">
                {normalizeList(output.standardsImpact?.categories).map((category) => (
                  <span className="chip" key={category}>{titleCase(category)}</span>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EvidenceList({ title, items, empty }) {
  const normalized = normalizeList(items);
  return (
    <div className="evidence-list">
      <strong>{title}</strong>
      {normalized.length ? (
        <ul>
          {normalized.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready') || text.includes('decided') || text.includes('accepted') || text.includes('resolved')) return 'success';
  return 'neutral';
}

function assetRoleLabel(asset) {
  const role = asset?.analysisJson?.role || '';
  if (role) return role.split('.')[0];
  const map = {
    'mockup-image': 'Visual mockup',
    pdf: 'Requirement document',
    document: 'Requirement document',
    spreadsheet: 'Structured data',
    'api-sample': 'API sample',
    notes: 'Notes',
    presentation: 'Presentation',
    'context-file': 'Context file'
  };
  return map[asset?.fileType] || titleCase(asset?.fileType || 'Context file');
}

function assetExtractionLabel(asset) {
  const status = asset?.analysisJson?.localExtraction?.status || 'not_analyzed';
  if (status === 'extracted') return 'Local Excerpt';
  if (status === 'empty') return 'Empty';
  if (status === 'not_extracted') return 'Stored Only';
  return titleCase(status);
}

function assetExtractionTone(asset) {
  const status = asset?.analysisJson?.localExtraction?.status || 'not_analyzed';
  if (status === 'extracted') return 'success';
  if (status === 'not_extracted') return 'warning';
  return 'neutral';
}

function assetAiEnrichmentLabel(asset) {
  const enrichment = asset?.analysisJson?.aiEnrichment || {};
  if (!enrichment.recommended) return 'Not Required';
  if (enrichment.status === 'optional_not_run') return 'Optional';
  return titleCase(enrichment.status || 'Optional');
}

function assetAiEnrichmentTone(asset) {
  const enrichment = asset?.analysisJson?.aiEnrichment || {};
  if (!enrichment.recommended) return 'neutral';
  if (enrichment.status === 'not_required') return 'success';
  return 'info';
}
