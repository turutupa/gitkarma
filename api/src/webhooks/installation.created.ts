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

  log.info("GitKarma app installed. Processing installation event...");
  const repositories = payload.repositories || [];
  // Create repo && collabs entries
  for (const repository of repositories) {
    log.info(`Processing repository: ${repository.full_name}`);
    const repoOwner = payload.installation.account.login;
    const repoOwnerId = payload.installation.account.id;
    const senderId = payload.sender.id;
    const repo = await getOrDefaultGithubRepo(
      repository.id,
      repository.name,
      repoOwner
    );

    // add repo owner as admin
    await getOrDefaultGithubUser(
      repo,
      repoOwnerId,
      repoOwner,
      EUserRepoRole.ADMIN
    );

    // add sender as admin if it's not the repo owner
    if (senderId !== repoOwnerId) {
      await getOrDefaultGithubUser;
    }

    // 1. Get direct collaborators
    const { data: collaborators } = await octokit.rest.repos.listCollaborators({
      owner: repoOwner,
      repo: repository.name,
    });

    for (const collaborator of collaborators) {
      const { id, login } = collaborator;
      await getOrDefaultGithubUser(repo, id, login, EUserRepoRole.COLLABORATOR);
    }

    // 2. Check if repository is in an organization
    const { data: repoData } = await octokit.rest.repos.get({
      owner: repoOwner,
      repo: repository.name,
    });

    // 3. If it's an org repo, get teams with access
    if (repoData.owner.type != "Organization") {
      return;
    }
    try {
      const { data: teams } = await octokit.rest.repos.listTeams({
        owner: repoOwner,
        repo: repository.name,
      });

      // 4. For each team, get members
      for (const team of teams) {
        const { data: members } = await octokit.rest.teams.listMembersInOrg({
          org: repoData.owner.login,
          team_slug: team.slug,
        });
        for (const member of members) {
          const { id, login } = member;
          await getOrDefaultGithubUser(
            repo,
            id,
            login,
            EUserRepoRole.ORGANIZATION_MEMBER
          );
        }
      }
    } catch (error) {
      log.error({ error }, "Error fetching team members from organization");
    }
  }
};
