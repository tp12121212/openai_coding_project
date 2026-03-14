import { createHash } from 'node:crypto';

interface GitHubRequestOptions extends RequestInit {
  token: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  owner: { login: string };
}

interface GitRefResponse {
  object: { sha: string };
}

interface TreeResponse {
  sha: string;
  tree: Array<{ path: string; type: 'blob' | 'tree'; sha: string }>;
}

interface GitHubErrorResponse {
  message?: string;
  documentation_url?: string;
  errors?: Array<{
    resource?: string;
    field?: string;
    code?: string;
    message?: string;
  }>;
}

interface ParsedScopeHeaders {
  acceptedScopes: string[];
  tokenScopes: string[];
}

export interface GitHubDiagnosticSummary {
  endpoint: string;
  status: number;
  message?: string;
  documentationUrl?: string;
  acceptedScopes: string[];
  tokenScopes: string[];
  suspectedAuthIssue: boolean;
  requestId?: string;
}

export class GitHubApiError extends Error {
  readonly diagnostics: GitHubDiagnosticSummary;

  constructor(diagnostics: GitHubDiagnosticSummary) {
    const summary = [
      `GitHub API ${diagnostics.endpoint} failed (${diagnostics.status})`,
      diagnostics.message ? `message=${diagnostics.message}` : null,
      diagnostics.documentationUrl ? `docs=${diagnostics.documentationUrl}` : null,
      diagnostics.suspectedAuthIssue ? 'possibleCause=token or scope permission issue; re-authentication may be required.' : null
    ]
      .filter(Boolean)
      .join('; ');
    super(summary);
    this.name = 'GitHubApiError';
    this.diagnostics = diagnostics;
  }
}

function parseScopes(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function parseScopeHeaders(headers: Headers): ParsedScopeHeaders {
  return {
    acceptedScopes: parseScopes(headers.get('x-accepted-oauth-scopes')),
    tokenScopes: parseScopes(headers.get('x-oauth-scopes'))
  };
}

function buildDiagnosticSummary(route: string, response: Response, payload?: GitHubErrorResponse): GitHubDiagnosticSummary {
  const scopes = parseScopeHeaders(response.headers);
  const message = formatGitHubErrorMessage(payload);
  const suspectedAuthIssue = response.status === 401 || response.status === 403 || (response.status === 404 && message === 'Not Found');

  return {
    endpoint: route,
    status: response.status,
    message,
    documentationUrl: typeof payload?.documentation_url === 'string' ? payload.documentation_url : undefined,
    acceptedScopes: scopes.acceptedScopes,
    tokenScopes: scopes.tokenScopes,
    suspectedAuthIssue,
    requestId: response.headers.get('x-github-request-id') ?? undefined
  };
}

function formatGitHubErrorMessage(payload?: GitHubErrorResponse): string | undefined {
  const baseMessage = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const details = (payload?.errors ?? [])
    .map((error) => {
      const explicitMessage = typeof error.message === 'string' ? error.message.trim() : '';
      if (explicitMessage) {
        return explicitMessage;
      }
      const code = typeof error.code === 'string' ? error.code.trim() : '';
      const field = typeof error.field === 'string' ? error.field.trim() : '';
      if (code && field) {
        return `${field}: ${code}`;
      }
      if (code) {
        return code;
      }
      return '';
    })
    .filter(Boolean);

  if (!baseMessage && details.length === 0) {
    return undefined;
  }

  if (details.length === 0) {
    return baseMessage;
  }

  return `${baseMessage || 'GitHub API request failed.'} details=${details.join(' | ')}`;
}

function logGitHubFailure(diagnostics: GitHubDiagnosticSummary): void {
  console.error('[github] API request failed', {
    endpoint: diagnostics.endpoint,
    status: diagnostics.status,
    message: diagnostics.message,
    documentationUrl: diagnostics.documentationUrl,
    acceptedScopes: diagnostics.acceptedScopes,
    tokenScopes: diagnostics.tokenScopes,
    suspectedAuthIssue: diagnostics.suspectedAuthIssue,
    requestId: diagnostics.requestId
  });
}

export function isGitHubApiError(error: unknown): error is GitHubApiError {
  return error instanceof GitHubApiError;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function githubRequest<T>(route: string, options: GitHubRequestOptions): Promise<T> {
  const response = await fetch(`https://api.github.com${route}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const rawBody = await response.text();
    const payload = safeJsonParse<GitHubErrorResponse>(rawBody) ?? { message: rawBody || response.statusText };
    const diagnostics = buildDiagnosticSummary(route, response, payload);
    logGitHubFailure(diagnostics);
    throw new GitHubApiError(diagnostics);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function mapGitHubErrorForClient(error: unknown): { error: string; diagnostics?: GitHubDiagnosticSummary } {
  if (isGitHubApiError(error)) {
    const diagnostics = error.diagnostics;
    const lowerMessage = diagnostics.message?.toLowerCase() ?? '';
    const repositoryNameConflict = diagnostics.status === 422 && lowerMessage.includes('name already exists on this account');
    const summary = [
      `GitHub API ${diagnostics.endpoint} failed (${diagnostics.status})`,
      diagnostics.message ? `message=${diagnostics.message}` : null,
      diagnostics.documentationUrl ? `docs=${diagnostics.documentationUrl}` : null,
      repositoryNameConflict ? 'possibleCause=repository name is already in use for this GitHub account; choose a different repo name or use existing-repo mode.' : null,
      diagnostics.suspectedAuthIssue ? 'possibleCause=token or scope permission issue; re-authentication may be required.' : null
    ]
      .filter(Boolean)
      .join('; ');

    return { error: summary, diagnostics };
  }

  return { error: error instanceof Error ? error.message : 'Unknown GitHub API error.' };
}

export async function detectGitHubCapabilities(token: string): Promise<{
  tokenPresent: boolean;
  tokenScopes: string[];
  repoListCapability: boolean | 'unknown';
  repoCreateCapability: boolean | 'unknown';
  tokenType: 'oauth' | 'unknown';
}> {
  const capabilities = {
    tokenPresent: Boolean(token),
    tokenScopes: [] as string[],
    repoListCapability: 'unknown' as boolean | 'unknown',
    repoCreateCapability: 'unknown' as boolean | 'unknown',
    tokenType: 'oauth' as const
  };

  if (!token) {
    return { ...capabilities, tokenType: 'unknown' };
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    capabilities.tokenScopes = parseScopeHeaders(response.headers).tokenScopes;

    if (!response.ok) {
      const raw = await response.text();
      const payload = safeJsonParse<GitHubErrorResponse>(raw) ?? { message: raw || response.statusText };
      const diagnostics = buildDiagnosticSummary('/user', response, payload);
      capabilities.repoListCapability = diagnostics.suspectedAuthIssue ? false : 'unknown';
      capabilities.repoCreateCapability = diagnostics.suspectedAuthIssue ? false : 'unknown';
      return capabilities;
    }
  } catch {
    return capabilities;
  }

  capabilities.repoListCapability = true;
  capabilities.repoCreateCapability = capabilities.tokenScopes.includes('repo') || capabilities.tokenScopes.includes('public_repo');
  return capabilities;
}

export async function listRepositories(token: string, page: number, search: string): Promise<{ repos: GitHubRepo[]; hasNextPage: boolean }> {
  const result = await githubRequest<GitHubRepo[]>(`/user/repos?per_page=50&page=${page}&sort=updated`, { method: 'GET', token });
  const filtered = result
    .filter((repo) => (search ? repo.full_name.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
  return { repos: filtered, hasNextPage: result.length === 50 };
}

export async function createRepository(token: string, config: { repoName: string; visibility: 'public' | 'private'; description?: string }): Promise<GitHubRepo> {
  return githubRequest<GitHubRepo>('/user/repos', {
    method: 'POST',
    token,
    body: JSON.stringify({
      name: config.repoName,
      private: config.visibility === 'private',
      description: config.description ?? '',
      auto_init: false
    })
  });
}

async function getDefaultBranchHead(token: string, owner: string, repo: string, branch: string): Promise<string | null> {
  try {
    const ref = await githubRequest<GitRefResponse>(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, { method: 'GET', token });
    return ref.object.sha;
  } catch {
    return null;
  }
}

function normalizeDefaultBranch(branch: string): string {
  const normalized = branch.trim();
  return normalized.length > 0 ? normalized : 'main';
}

async function createCommitForFiles(token: string, owner: string, repo: string, files: Array<{ path: string; content: string }>, message: string, parentCommitSha: string | null): Promise<string> {
  const blobShas = new Map<string, string>();
  for (const file of files) {
    const blob = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content: file.content, encoding: 'utf-8' })
    });
    blobShas.set(file.path, blob.sha);
  }

  let baseTreeSha: string | undefined;
  if (parentCommitSha) {
    const parentCommit = await githubRequest<{ tree: { sha: string } }>(`/repos/${owner}/${repo}/git/commits/${parentCommitSha}`, { method: 'GET', token });
    baseTreeSha = parentCommit.tree.sha;
  }

  const tree = await githubRequest<TreeResponse>(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: [...files].sort((a, b) => a.path.localeCompare(b.path)).map((file) => ({ path: file.path, mode: '100644', type: 'blob', sha: blobShas.get(file.path) }))
    })
  });

  const commit = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    token,
    body: JSON.stringify({ message, tree: tree.sha, parents: parentCommitSha ? [parentCommitSha] : [] })
  });

  return commit.sha;
}

async function createInitialCommitWithoutParent(
  token: string,
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string }>,
  message: string
): Promise<string> {
  const tree = await githubRequest<TreeResponse>(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      tree: [...files].sort((a, b) => a.path.localeCompare(b.path)).map((file) => ({ path: file.path, mode: '100644', type: 'blob', content: file.content }))
    })
  });

  const commit = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    token,
    body: JSON.stringify({ message, tree: tree.sha, parents: [] })
  });

  return commit.sha;
}

export async function commitToDefaultBranch(token: string, owner: string, repo: string, branch: string, files: Array<{ path: string; content: string }>): Promise<void> {
  const resolvedBranch = normalizeDefaultBranch(branch);
  const headSha = await getDefaultBranchHead(token, owner, repo, resolvedBranch);
  let commitSha: string;

  try {
    commitSha = await createCommitForFiles(token, owner, repo, files, 'Initial scaffold commit', headSha);
  } catch (error) {
    const isEmptyRepositoryInitializationError =
      isGitHubApiError(error) &&
      (error.diagnostics.endpoint === `/repos/${owner}/${repo}/git/blobs` ||
        error.diagnostics.endpoint === `/repos/${owner}/${repo}/git/trees`) &&
      error.diagnostics.status === 409 &&
      (error.diagnostics.message?.toLowerCase().includes('repository is empty') ?? false);

    if (!isEmptyRepositoryInitializationError) {
      throw error;
    }

    try {
      const initialCommitSha = await createInitialCommitWithoutParent(token, owner, repo, files, 'Initial scaffold commit');
      await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        token,
        body: JSON.stringify({ ref: `refs/heads/${resolvedBranch}`, sha: initialCommitSha })
      });
    } catch (initializationError) {
      const detail = initializationError instanceof Error ? initializationError.message : 'Unknown initialization error';
      throw new Error(`GitHub repository initialization failed: {"code":"EMPTY_REPO_INIT_FAILED","branch":"${resolvedBranch}","detail":"${detail}"}`);
    }
    return;
  }

  if (headSha) {
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(resolvedBranch)}`, { method: 'PATCH', token, body: JSON.stringify({ sha: commitSha, force: false }) });
  } else {
    await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      token,
      body: JSON.stringify({ ref: `refs/heads/${resolvedBranch}`, sha: commitSha })
    });
  }
}

export async function createBranchAndPullRequest(params: {
  token: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  files: Array<{ path: string; content: string }>;
}): Promise<{ branchName: string; prUrl: string; filesAdded: string[]; filesSkipped: string[]; collisions: string[] }> {
  const headSha = await getDefaultBranchHead(params.token, params.owner, params.repo, params.defaultBranch);
  if (!headSha) {
    throw new Error('Default branch head was not found.');
  }

  const tree = await githubRequest<TreeResponse>(`/repos/${params.owner}/${params.repo}/git/trees/${headSha}?recursive=1`, { method: 'GET', token: params.token });
  const existingPaths = new Set(tree.tree.filter((item) => item.type === 'blob').map((item) => item.path));

  const filesAdded: string[] = [];
  const filesSkipped: string[] = [];
  const collisions: string[] = [];
  const additiveFiles = [...params.files].sort((a, b) => a.path.localeCompare(b.path)).filter((file) => {
    if (existingPaths.has(file.path)) {
      collisions.push(file.path);
      filesSkipped.push(file.path);
      return false;
    }
    filesAdded.push(file.path);
    return true;
  });

  const hash = createHash('sha256').update(params.repo + filesAdded.join('|')).digest('hex').slice(0, 8);
  const branchName = `scaffold/update-${hash}`;

  await githubRequest(`/repos/${params.owner}/${params.repo}/git/refs`, {
    method: 'POST',
    token: params.token,
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: headSha })
  });

  if (additiveFiles.length > 0) {
    const commitSha = await createCommitForFiles(params.token, params.owner, params.repo, additiveFiles, 'Add scaffold artifacts (non-destructive)', headSha);
    await githubRequest(`/repos/${params.owner}/${params.repo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
      method: 'PATCH',
      token: params.token,
      body: JSON.stringify({ sha: commitSha, force: false })
    });
  }

  const pr = await githubRequest<{ html_url: string }>(`/repos/${params.owner}/${params.repo}/pulls`, {
    method: 'POST',
    token: params.token,
    body: JSON.stringify({
      title: 'Scaffold update (non-destructive)',
      body: `Automated scaffold update.\n\nCollisions skipped: ${collisions.length}.\nFiles added: ${filesAdded.length}.`,
      head: branchName,
      base: params.defaultBranch
    })
  });

  return { branchName, prUrl: pr.html_url, filesAdded, filesSkipped, collisions };
}

export async function getRepo(token: string, fullName: string): Promise<GitHubRepo> {
  return githubRequest<GitHubRepo>(`/repos/${fullName}`, { method: 'GET', token });
}
