import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GitHubRepoConfig {
  owner: string;
  repo: string;
  private: boolean;
  description?: string;
  token: string;
}

export interface RepoVariable {
  name: string;
  value: string;
}

async function githubRequest<T>(token: string, route: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.github.com${route}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${route} failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export async function createRepository(config: GitHubRepoConfig): Promise<{ html_url: string; clone_url: string }> {
  try {
    return await githubRequest(config.token, `/orgs/${config.owner}/repos`, {
      method: 'POST',
      body: JSON.stringify({
        name: config.repo,
        private: config.private,
        description: config.description ?? ''
      })
    });
  } catch {
    return githubRequest(config.token, '/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: config.repo,
        private: config.private,
        description: config.description ?? ''
      })
    });
  }
}

export async function setRepositoryVariables(
  token: string,
  owner: string,
  repo: string,
  variables: RepoVariable[]
): Promise<string[]> {
  const updated: string[] = [];
  for (const variable of [...variables].sort((a, b) => a.name.localeCompare(b.name))) {
    await githubRequest(token, `/repos/${owner}/${repo}/actions/variables/${encodeURIComponent(variable.name)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: variable.name, value: variable.value })
    }).catch(async () => {
      await githubRequest(token, `/repos/${owner}/${repo}/actions/variables`, {
        method: 'POST',
        body: JSON.stringify({ name: variable.name, value: variable.value })
      });
    });
    updated.push(variable.name);
  }
  return updated;
}

export async function initializeAndPushRepository(
  localPath: string,
  branchName: string,
  cloneUrl: string,
  token: string
): Promise<void> {
  const remoteUrl = cloneUrl.replace('https://', `https://x-access-token:${token}@`);
  const git = async (...args: string[]) => execFileAsync('git', args, { cwd: localPath });

  await git('init');
  await git('checkout', '-B', branchName);
  await git('add', '.');
  await git('commit', '-m', 'Initial scaffold commit');
  await git('remote', 'add', 'origin', remoteUrl);
  await git('push', '-u', 'origin', branchName);

  const gitConfigPath = path.join(localPath, '.git', 'config');
  const configContent = await fs.readFile(gitConfigPath, 'utf8');
  await fs.writeFile(gitConfigPath, configContent.replace(remoteUrl, cloneUrl), 'utf8');
}
