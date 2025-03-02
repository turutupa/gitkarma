import { Octokit } from "@octokit/rest";
import { TRepo, TUserRepoAccount } from "db/models.ts";
import log from "log.ts";

/**
 * Verifies if the authenticated user is an admin or owner of a repository.
 * Authenticates with Octokit using the provided bearer token.
 *
 * @param sessionUser - The session user populated by middleware.
 * @param repoId - The repository ID.
 * @returns A promise that resolves to true if the user is the repository owner or an admin collaborator; otherwise, false.
 */
export async function verifyUserIsRepoAdmin(
  octokit: Octokit,
  user: TUserRepoAccount,
  repo: TRepo
) {
  log.debug({ user, repo }, "Verifying user is repo admin");
  if (!user || !repo) return false;

  // Check if session user is the repository owner.
  if (user.user.github_username === repo.repo_owner) {
    return true;
  }

  // Use GitHub API only for collaborator permission check.
  try {
    const { data: permissionData } =
      await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner: repo.repo_owner,
        repo: repo.repo_name,
        username: user.user.github_username,
      });
    return permissionData.permission === "admin";
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}
