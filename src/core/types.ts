export type Severity = 'blocker' | 'warning' | 'note';
export type Effect = 'read' | 'mutate' | 'external-navigation' | 'mixed' | 'unknown';
export type Approval = 'required' | 'optional' | 'none';
export type Profile = 'fresh' | 'real' | 'selectable';
export type CredentialScope = 'none' | 'origin-scoped' | 'user-provided' | 'browser-session';

export interface Finding {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  claim: ClaimName;
}

export type ClaimName = 'effect' | 'approval' | 'evidence' | 'profile' | 'origins' | 'credentials';

export interface Claim<T = unknown> {
  declared: boolean;
  value?: T;
  source?: string;
  invalid?: string;
}

export interface ToolClaims {
  effect: Claim<Effect>;
  approval: Claim<Approval>;
  evidence: Claim<{ before: boolean; after: boolean }>;
  profile: Claim<Profile>;
  origins: Claim<string[]>;
  credentials: Claim<CredentialScope>;
}

export interface ToolAssessment {
  index: number;
  name: string;
  description: string;
  claims: ToolClaims;
  findings: Finding[];
  inferredSignals: string[];
  status: 'block' | 'review' | 'clear';
}

export interface SafetyReport {
  schemaVersion: '1.0';
  generatedAt: string;
  source: { kind: 'manifest' | 'transcript'; toolCount: number };
  summary: {
    status: 'block' | 'review' | 'clear';
    score: number;
    blockers: number;
    warnings: number;
    notes: number;
    missingClaims: number;
  };
  tools: ToolAssessment[];
  disclaimer: string;
}

export interface Policy {
  requiredClaims: ClaimName[];
  failOn: 'blocker' | 'warning';
}

export const DEFAULT_POLICY: Policy = {
  requiredClaims: ['effect', 'approval', 'evidence'],
  failOn: 'blocker'
};
