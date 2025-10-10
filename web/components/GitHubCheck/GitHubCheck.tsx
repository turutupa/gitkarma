import React from 'react';
import css from './GitHubCheck.module.css';

type FailedCheck = {
  variant: 'failed';
  currentBalance: number;
  requiredBalance: number;
  shortfall?: number;
};

type CompletedCheck = {
  variant: 'completed';
  oldBalance: number;
  newBalance: number;
  mergePenalty: number;
};

export type GitHubCheckProps = (FailedCheck | CompletedCheck) & {
  title?: string;
  compact?: boolean;
};

export const GitHubCheck: React.FC<GitHubCheckProps> = (props) => {
  if (props.variant === 'failed') {
    const shortfall = props.shortfall ?? props.requiredBalance - props.currentBalance;

    return (
      <div className={css.wrapper} data-variant="failed">
        <div className={css.header}>
          <span className={`${css.statusIcon} ${css.failed}`}>✖</span>
          <span className={css.title}>{props.title || 'GitKarma Funds Check Failed'}</span>
        </div>
        <div className={css.body}>
          <p className={css.lead}>Balance too low to fund this pull request.</p>
          <ul className={css.list}>
            <li>Current balance: {props.currentBalance} karma</li>
            <li>Required balance: {props.requiredBalance} karma</li>
            <li>Shortfall: {shortfall} karma</li>
          </ul>
          <p className={css.sub}>
            Earn karma by reviewing teammates’ pull requests. Re-run the check after increasing your
            balance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={css.wrapper} data-variant="completed">
      <div className={css.header}>
        <span className={`${css.statusIcon} ${css.passed}`}>✔</span>
        <span className={css.title}>{props.title || 'GitKarma Funds Check Passed'}</span>
      </div>
      <div className={css.body}>
        <p className={css.lead}>Required karma successfully reserved for this pull request.</p>
        <ul className={css.list}>
          <li>Previous balance: {props.oldBalance} karma</li>
          <li>Deducted: {props.mergePenalty} karma</li>
          <li>New balance: {props.newBalance} karma</li>
        </ul>
        <p className={css.sub}>You may proceed to merge once all other required checks complete.</p>
      </div>
    </div>
  );
};
