// CI/CD workflow sanity tests — ensures the GitHub Actions YAML is parseable
// AND that the workflows contain the jobs we depend on for regression
// coverage. Catches accidental deletions (e.g. someone deletes the test
// job because "it's slow") before they reach the repo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

const WF_DIR = join(__dirname, '..', '..', '.github', 'workflows');

const load = (name: string) => {
  const text = readFileSync(join(WF_DIR, name), 'utf8');
  return yaml.parse(text);
};

describe('ci.yml', () => {
  const wf = load('ci.yml');

  it('parses as valid YAML', () => {
    expect(wf).toBeDefined();
  });

  it('triggers on push and pull_request to main / develop', () => {
    const on = wf.on || wf.true; // YAML 1.1 may parse "on" as boolean true
    const triggers = on.push?.branches || [];
    const prBranches = on.pull_request?.branches || [];
    expect(triggers).toContain('main');
    expect(triggers).toContain('develop');
    expect(prBranches).toContain('main');
  });

  it('has the three required jobs: backend, frontend, audit', () => {
    expect(wf.jobs).toHaveProperty('backend');
    expect(wf.jobs).toHaveProperty('frontend');
    expect(wf.jobs).toHaveProperty('audit');
  });

  it('backend job runs MySQL service for integration tests', () => {
    const backend = wf.jobs.backend;
    expect(backend.services).toHaveProperty('mysql');
    expect(backend.services.mysql.image).toMatch(/mysql:/);
  });

  it('backend job runs tsc + vitest (both db-free and integration)', () => {
    const backend = wf.jobs.backend;
    const stepNames = (backend.steps as any[]).map(s => s.name || '');
    // Some step is the TypeScript check
    expect(stepNames.some(n => /TypeScript/i.test(n))).toBe(true);
    // Two test steps: one for db-free, one for integration
    const testSteps = stepNames.filter(n => /test/i.test(n));
    expect(testSteps.length).toBeGreaterThanOrEqual(2);
  });

  it('frontend job runs vue-tsc + build', () => {
    const frontend = wf.jobs.frontend;
    const stepNames = (frontend.steps as any[]).map(s => s.name || '');
    expect(stepNames.some(n => /TypeScript/.test(n))).toBe(true);
    expect(stepNames.some(n => n === 'Build')).toBe(true);
  });
});

describe('snyk.yml', () => {
  const wf = load('snyk.yml');

  it('parses as valid YAML', () => {
    expect(wf).toBeDefined();
  });

  it('triggers on push and pull_request', () => {
    const on = wf.on || wf.true;
    expect(on.push).toBeDefined();
    expect(on.pull_request).toBeDefined();
    // Manual trigger with severity threshold input
    expect(on.workflow_dispatch).toBeDefined();
    expect(on.workflow_dispatch.inputs?.severity_threshold).toBeDefined();
  });

  it('scans backend + frontend + (optionally) container', () => {
    expect(wf.jobs).toHaveProperty('backend');
    expect(wf.jobs).toHaveProperty('frontend');
    expect(wf.jobs).toHaveProperty('container');
  });

  it('backend job invokes `snyk test`', () => {
    const backend = wf.jobs.backend;
    const stepNames = (backend.steps as any[]).map(s => s.name || '');
    const snykStep = stepNames.find(n => /snyk/i.test(n));
    expect(snykStep).toBeDefined();
  });

  it('uses SNYK_TOKEN secret (never hard-codes credentials)', () => {
    const allText = readFileSync(join(WF_DIR, 'snyk.yml'), 'utf8');
    expect(allText).toMatch(/secrets\.SNYK_TOKEN/);
    expect(allText).not.toMatch(/SNYK_TOKEN\s*[:=]\s*['"][a-z0-9]{20,}/i);
  });

  it('uploads the JSON report as an artifact', () => {
    const allText = readFileSync(join(WF_DIR, 'snyk.yml'), 'utf8');
    expect(allText).toMatch(/actions\/upload-artifact/);
    expect(allText).toMatch(/snyk-report\.json/);
  });
});

describe('.snyk policy file', () => {
  const policy = readFileSync(join(__dirname, '..', '..', '.snyk'), 'utf8');

  it('exists and is non-empty', () => {
    expect(policy.length).toBeGreaterThan(0);
  });

  it('contains the expected sections (project-settings, ignore)', () => {
    expect(policy).toMatch(/project-settings:/);
    expect(policy).toMatch(/ignore:/);
  });

  it('does NOT contain any committed secrets', () => {
    // Sanity: no API key patterns in the policy file
    expect(policy).not.toMatch(/snyp_[a-z0-9]{20,}/i);
  });
});

describe('deploy.yml', () => {
  const wf = load('deploy.yml');

  it('parses as valid YAML', () => {
    expect(wf).toBeDefined();
  });

  it('only triggers manually (workflow_dispatch)', () => {
    const on = wf.on || wf.true;
    expect(on.workflow_dispatch).toBeDefined();
    // Should NOT auto-trigger on push
    expect(on.push).toBeUndefined();
  });

  it('requires the production GitHub environment', () => {
    const deploy = wf.jobs.deploy;
    expect(deploy.environment).toBe('production');
  });

  it('references the required production secrets', () => {
    const allText = readFileSync(join(WF_DIR, 'deploy.yml'), 'utf8');
    expect(allText).toMatch(/secrets\.PRODUCTION_SSH_KEY/);
    expect(allText).toMatch(/secrets\.PRODUCTION_HOST/);
    expect(allText).toMatch(/secrets\.PRODUCTION_PATH/);
    expect(allText).toMatch(/secrets\.PRODUCTION_HEALTH_URL/);
  });

  it('includes a post-deploy smoke test', () => {
    const deploy = wf.jobs.deploy;
    const stepNames = (deploy.steps as any[]).map(s => s.name || '');
    expect(stepNames.some(n => /smoke/i.test(n))).toBe(true);
  });

  it('includes a rollback hint in the failure summary', () => {
    const allText = readFileSync(join(WF_DIR, 'deploy.yml'), 'utf8');
    expect(allText).toMatch(/rollback/i);
  });

  it('builds backend AND frontend into a single release artifact', () => {
    const build = wf.jobs.build;
    const stepNames = (build.steps as any[]).map(s => s.name || '');
    expect(stepNames.some(n => /Build backend/i.test(n))).toBe(true);
    expect(stepNames.some(n => /Build frontend/i.test(n))).toBe(true);
    expect(stepNames.some(n => /Package release/i.test(n))).toBe(true);
  });
});
