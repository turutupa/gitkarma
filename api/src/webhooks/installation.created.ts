import type { Octokit } from "@octokit/rest";
import type { InstallationCreatedEvent } from "@octokit/webhooks-types";
import log from "../log.ts";
import { getOrDefaultGithubRepo, getOrDefaultGithubUser } from "./utils.ts";

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

  log.debug("GitKarma app installed. Processing installation event...");
  const repositories = payload.repositories || [];
  // Create repo && collabs entries
  for (const repository of repositories) {
    const repo = await getOrDefaultGithubRepo(repository.id, repository.name);
    const { data: collaborators } = await octokit.rest.repos.listCollaborators({
      owner: payload.installation.account.login,
      repo: repo.repo_name,
    });
    for (const collaborator of collaborators) {
      const { id, login } = collaborator;
      await getOrDefaultGithubUser(repo, id, login);
    }
  }
};
