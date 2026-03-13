import { createHash } from 'node:crypto';

interface GitHubRequestOptions extends RequestInit {
  token: string;
}

interface GitHubRepo {
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

async function githubRequest<T>(route: string, options: GitHubRequestOptions): Promise<T> {
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
    const body = await response.text();
    throw new Error(`GitHub API ${route} failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
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
    body: JSON.stringify({ name: config.repoName, private: config.visibility === 'private', description: config.description ?? '', auto_init: false })
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

export async function commitToDefaultBranch(token: string, owner: string, repo: string, branch: string, files: Array<{ path: string; content: string }>): Promise<void> {
  const headSha = await getDefaultBranchHead(token, owner, repo, branch);
  const commitSha = await createCommitForFiles(token, owner, repo, files, 'Initial scaffold commit', headSha);

  if (headSha) {
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', token, body: JSON.stringify({ sha: commitSha, force: false }) });
  } else {
    await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      token,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commitSha })
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
