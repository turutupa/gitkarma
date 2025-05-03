import { EUserRepoRole } from "@/db/entities/UserRepo";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { InstallationCreatedEvent } from "@octokit/webhooks-types";
import { getOrDefaultGithubRepo, getOrDefaultGithubUser } from "./utils";

/**
 * handleInstallationCreated:
 *
 * This handler is invoked when the GitKarma app is installed on a GitHub account
 * (either a user or an organization). It processes the installation event by:
 *
 * - Retrieving installation details and the list of repositories from the webhook payload.
 * - For each repository in the installation:
 *   - Checking if a repository record already exists in the local database.
 *   - Creating a new repository record in the database if one does not already exist.
 *   - Optionally, fetching the repository's collaborators to create user records in the database.
 *
 * @param {Object} params - The parameters for the handler.
 * @param {Octokit} params.octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {InstallationCreatedEvent} params.payload - The webhook payload for the installation created event.
 *
 * @returns {Promise<void>} A promise that resolves when the event processing is complete.
 */
export const handleInstallationCreated = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: InstallationCreatedEvent;
}): Promise<void> => {
  if (payload.action !== "created") {
    return;
  }

  // may bring back if decided to start logging on repo added
  // let baseUrl = "https://github.com"; // fallback default
  // if (payload.installation?.account?.html_url) {
  //   const url = new URL(payload.installation.account.html_url);
  //   baseUrl = `${url.protocol}//${url.hostname}`;
  // }

  log.info("GitKarma app installed. Processing installation event...");
  const repositories = payload.repositories || [];
  // Create repo && collabs entries
  for (const repository of repositories) {
    log.info(`Processing repository: ${repository.full_name}`);
    const ownerIsUser = payload.installation.account.type === "User";
    const githubRepoOwnerName = payload.installation.account.login;
    const githubRepoOwnerId = payload.installation.account.id;
    const githubRepoOwnerUrl = payload.installation.account.html_url;
    const githubSenderName = payload.sender.login;
    const githubSenderUrl = payload.sender.html_url;
    const githubSenderId = payload.sender.id;
    const installationId = payload.installation.id;
    // const repoUrl = `${baseUrl}/${repository.full_name}`;

    const repo = await getOrDefaultGithubRepo(
      repository.id,
      repository.name,
      githubRepoOwnerName,
      installationId
    );

    // add sender as admin if it's not the repo owner
    if (githubSenderId !== githubRepoOwnerId) {
      await getOrDefaultGithubUser(
        repo,
        githubSenderId,
        githubSenderName,
        githubSenderUrl,
        EUserRepoRole.ADMIN
      );
    }

    // add repo owner as admin
    if (ownerIsUser) {
      await getOrDefaultGithubUser(
        repo,
        githubRepoOwnerId,
        githubRepoOwnerName,
        githubRepoOwnerUrl,
        EUserRepoRole.ADMIN
      );
    }

    // 1. Get direct collaborators
    const { data: collaborators } = await octokit.rest.repos.listCollaborators({
      owner: githubRepoOwnerName,
      repo: repository.name,
    });

    for (const collaborator of collaborators) {
      const { id, login, html_url } = collaborator;
      await getOrDefaultGithubUser(
        repo,
        id,
        login,
        html_url,
        EUserRepoRole.COLLABORATOR
      );
    }

    // 2. Check if repository is in an organization
    const { data: repoData } = await octokit.rest.repos.get({
      owner: githubRepoOwnerName,
      repo: repository.name,
    });

    // 3. If it's an org repo, get teams with access
    try {
      const { data: teams } = await octokit.rest.repos.listTeams({
        owner: githubRepoOwnerName,
        repo: repository.name,
      });

      // 4. For each team, get members
      for (const team of teams) {
        const { data: members } = await octokit.rest.teams.listMembersInOrg({
          org: repoData.owner.login,
          team_slug: team.slug,
        });
        for (const member of members) {
          const { id, login, html_url } = member;
          await getOrDefaultGithubUser(
            repo,
            id,
            login,
            html_url,
            EUserRepoRole.ORGANIZATION_MEMBER
          );
        }
      }
    } catch (error) {
      log.error({ error }, "Error fetching team members from organization");
    }
  }
};
