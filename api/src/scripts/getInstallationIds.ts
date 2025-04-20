import { createAppAuth } from "@octokit/auth-app";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// Replace these with your GitHub App's credentials
const appId = 0;
const privateKey = ``;

async function getInstallationIds() {
  const auth = createAppAuth({
    appId,
    privateKey,
  });

  // Retrieve a JWT to authenticate as the app
  const appAuthentication = await auth({ type: "app" });

  // Fetch installations
  const response = await fetch("https://api.github.com/app/installations", {
    headers: {
      authorization: `Bearer ${appAuthentication.token}`,
      accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded with status: ${response.status}`);
  }

  const installations: any = await response.json();
  const installationIds = installations.map((inst) => ({
    name: inst.account.login,
    id: inst.id,
  }));

  console.log("Installation IDs:", installationIds);
  return installationIds;
}

getInstallationIds().catch((error) => {
  console.error("Error retrieving installation IDs:", error);
});
