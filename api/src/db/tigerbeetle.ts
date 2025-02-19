import crypto from "crypto";
import log from "log.ts";
import {
  AccountFlags,
  CreateAccountError,
  createClient,
  id as uuid,
  type Account,
  type Client,
  type CreateTransfersError,
  type Transfer,
} from "tigerbeetle-node";

export enum EAccountType {
  User = 1001,
  Repo = 4001,
}

/**
 * Handles connection and queriest to tiger beetle database
 */
class TigerBeetle {
  private tb!: Client;

  private constructor() {}

  public static connect(): TigerBeetle {
    const tbHost = process.env.TB_HOST || "";
    const tbPort = Number(process.env.TB_PORT) || 3001;
    const tigerbeetle = new TigerBeetle();
    tigerbeetle.tb = createClient({
      cluster_id: 0n,
      replica_addresses: [`${tbHost}:${tbPort}` || "127.0.0.1:3001"],
    });
    log.info("Connection established to tigerbeetle");
    return tigerbeetle;
  }

  /**
   * createUserTBAccount:
   * Creates a tiger beetle account for users. Features max credit (credit cannot be greater than debit).
   * Starts with default amount of debits.
   *
   * @param userId
   * @param repoId
   * @returns
   */
  public async createUserAccount(userId: bigint, repoId: bigint) {
    const accountId = this.generateUserAccountId(userId, repoId);
    return await this.createTBAccount(
      accountId,
      Number(repoId),
      EAccountType.User,
      AccountFlags.credits_must_not_exceed_debits
    );
  }

  /**
   * createRepoAccount:
   * Creates a tiger beetle account for repositories. Features unlimited credit and debit.
   *
   * @param repoId - The id of the repo (not the github repo id)
   * @returns
   */
  public async createRepoAccount(repoId: bigint) {
    const accountId = this.generateRepoAccountId();
    return await this.createTBAccount(
      accountId,
      Number(repoId),
      EAccountType.Repo,
      AccountFlags.none
    );
  }

  /**
   * Creates a tiger beetle account for either a user or a repo
   *
   * @param accountId
   * @param repoId  - Use for the ledger number (pg granted repo id, not github repo id)
   * @param accountCode - Defines whether its a user or a repo account
   * @param flags - In our case primarily used to define a users account to not exceed credits, and repo should not have flags
   * @returns
   */
  private async createTBAccount(
    accountId: bigint,
    repoId: number,
    accountCode: number,
    flags: number
  ): Promise<Account> {
    const account: Account = {
      id: accountId,
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      reserved: 0,
      ledger: Number(repoId),
      code: accountCode,
      flags,
      timestamp: 0n,
    };
    const accountErrors = await this.tb.createAccounts([account]);

    for (const error of accountErrors) {
      switch (error.result) {
        case CreateAccountError.exists:
          throw new Error(`Batch account at ${error.index} already exists.`);
        default:
          throw new Error(
            `Batch account at ${error.index} failed to create: ${
              CreateAccountError[error.result]
            }.`
          );
      }
    }
    return account;
  }

  /**
   * getUserAccount:
   * Retrieves a tiger beetle account of a user for a given repo
   *
   * @param userId - user id (not github user id) of target user
   * @param repoId - repo id (not github repo id) of target repo
   * @returns - tiger beetle account of a user from a given repo
   */
  public async getUserAccount(
    userId: bigint,
    repoId: bigint
  ): Promise<Account> {
    const accountId = this.generateUserAccountId(userId, repoId);
    const accounts: Account[] = await this.tb.lookupAccounts([accountId]);
    return accounts[0];
  }

  /**
   * repoTransfersFundsToUser:
   * Transfer funds from repo to user.
   *
   * @param repoAccountId - tiger beetle account id of repo
   * @param userAccountId - tiger beetle account id of user
   * @param amount - debits to be traspassed
   * @param repoId - repo id (pg generated , not github id)
   */
  public async repoTransfersFundsToUser(
    repoAccountId: bigint,
    userAccountId: bigint,
    amount: bigint,
    repoId: number
  ): Promise<void> {
    // code for charging payments
    const transferCode: number = 1001;
    // When granting funds:
    // - the user’s account receives a debit (increases balance),
    // - and the repo account is credited (repo can have infinite credit).
    const transfer: Transfer = {
      id: uuid(),
      debit_account_id: userAccountId,
      credit_account_id: repoAccountId,
      amount,
      code: transferCode,
      ledger: repoId,
      flags: 0,
      timestamp: 0n,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
    };

    const transferErrors: CreateTransfersError[] =
      await this.tb.createTransfers([transfer]);
    if (transferErrors.length > 0) {
      throw new Error(`Transfer error: ${JSON.stringify(transferErrors)}`);
    }
  }

  /**
   * repoChargesFundsToUser:
   * Transfer funds from user to repo
   *
   * @param repoAccountId- tiger beetle account id of repo
   * @param userAccountId - tiger beetle account id of user
   * @param amount  - debits to be traspassed
   * @param repoId - repo id (pg generated , not github id)
   */
  public async repoChargesFundsToUser(
    repoAccountId: bigint,
    userAccountId: bigint,
    amount: bigint,
    repoId: number
  ): Promise<void> {
    const transferCode: number = 2001; // code for charging payments
    // When charging the user, you want to remove funds from the user’s asset account.
    // That means you add a credit entry to the user (reducing balance) and a debit to the repo.
    const transfer = {
      id: uuid(),
      debit_account_id: repoAccountId,
      credit_account_id: userAccountId,
      amount,
      code: transferCode,
      ledger: repoId,
      flags: 0,
      timestamp: 0n,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
    };

    const transferErrors = await this.tb.createTransfers([transfer]);
    if (transferErrors.length > 0) {
      throw new Error(`Transfer error: ${JSON.stringify(transferErrors)}`);
    }
  }

  /**
   * Generate UUID for repo
   * @returns - unique 64bit uuid
   */
  private generateRepoAccountId(): bigint {
    return uuid() % 2n ** 64n;
  }

  /**
   * generateUserAccountId:
   * Generates a hashed id from user's id (not github's but pg) and repo's id (not githubs but pg).
   * This way, in order to retrieve back a user's account, all you need to provide is the user's id and
   * repo's id to regenerate the account id.
   *
   * @param userId
   * @param repoId
   * @returns
   */
  private generateUserAccountId(userId: bigint, repoId: bigint) {
    const hash = crypto
      .createHash("sha256")
      .update(userId.toString())
      .update(repoId.toString())
      .digest("hex");
    // Convert the first 16 bytes of the hash to a BigInt
    const accountId = BigInt("0x" + hash.substring(0, 16));
    return accountId;
  }

  /**
   * getBalance:
   * Used to retrieve a user's balance. We don't care about the repo's balance.
   *
   * @param account
   * @returns
   */
  public getBalance(account: Account) {
    return account.debits_posted - account.credits_posted;
  }
}

export default TigerBeetle.connect();
