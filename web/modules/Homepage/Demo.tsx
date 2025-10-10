import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Fade } from 'react-awesome-reveal';
import { Avatar, Button, Text, Title } from '@mantine/core';
import { GitHubCheck } from '@/components/GitHubCheck/GitHubCheck';
import css from './Demo.module.css';

type SlideRenderer = (c: { next: () => void; restart: () => void }) => React.ReactNode;

const SLIDE_COUNT = 6;

export const Demo = () => {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SLIDE_COUNT - 1)), []);
  const restart = useCallback(() => setIndex(0), []);

  const reviewTarget =
    'This pull request looks great! The changes are well-structured, and the code is clean and easy to understand. Excellent work!';
  const commentTarget = '✨';

  const [reviewText, setReviewText] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentDone, setCommentDone] = useState(false);

  const [startReviewTyping, setStartReviewTyping] = useState(false);
  const [startCommentTyping, setStartCommentTyping] = useState(false);

  const REVIEW_START_DELAY = 800;
  const REVIEW_TYPE_SPEED = 20;
  const COMMENT_START_DELAY = 850;
  const COMMENT_TYPE_SPEED = 480; // single char reveal

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [animateHeight, setAnimateHeight] = useState(false);

  const recalcHeight = useCallback(() => {
    if (contentRef.current) {
      const contentH = contentRef.current.offsetHeight;

      // Measure container padding so we can compute comparable "content box" min height
      const PADDING_FALLBACK = 52; // rough fallback per side if measurement fails (3.25rem ≈ 52px)
      let padTop = PADDING_FALLBACK;
      let padBottom = PADDING_FALLBACK;
      if (contentRef.current.parentElement) {
        const cs = getComputedStyle(contentRef.current.parentElement);
        padTop = parseFloat(cs.paddingTop) || padTop;
        padBottom = parseFloat(cs.paddingBottom) || padBottom;
      }

      // Original visual min-height = 420px (includes padding). Convert to inner content min.
      const ORIGINAL_MIN_TOTAL = 420;
      const minInner = Math.max(0, ORIGINAL_MIN_TOTAL - (padTop + padBottom));

      // Extra breathing space so larger slides aren't flush to padding.
      const EXTRA_BUFFER = 32;

      const targetContentHeight = Math.max(contentH + EXTRA_BUFFER, minInner);

      setContainerHeight(targetContentHeight);
      if (!animateHeight) {
        requestAnimationFrame(() => setAnimateHeight(true));
      }
    }
  }, [animateHeight]);

  useLayoutEffect(() => {
    recalcHeight();
  }, [recalcHeight, index, reviewText, commentText]);

  useEffect(() => {
    window.addEventListener('resize', recalcHeight);
    return () => window.removeEventListener('resize', recalcHeight);
  }, [recalcHeight]);

  useEffect(() => {
    if (index === 2) {
      setReviewText('');
      setReviewDone(false);
      setStartReviewTyping(false);
      const d = setTimeout(() => setStartReviewTyping(true), REVIEW_START_DELAY);
      return () => clearTimeout(d);
    }
    if (index === 4) {
      setCommentText('');
      setCommentDone(false);
      setStartCommentTyping(false);
      const d = setTimeout(() => setStartCommentTyping(true), COMMENT_START_DELAY);
      return () => clearTimeout(d);
    }
  }, [index]);

  useEffect(() => {
    if (index !== 2 || !startReviewTyping) {
      return;
    }
    if (reviewText.length === reviewTarget.length) {
      setReviewDone(true);
      return;
    }
    const t = setTimeout(() => {
      setReviewText(reviewTarget.slice(0, reviewText.length + 1));
    }, REVIEW_TYPE_SPEED);
    return () => clearTimeout(t);
  }, [index, startReviewTyping, reviewText, reviewTarget]);

  useEffect(() => {
    if (index !== 4 || !startCommentTyping) {
      return;
    }
    if (commentText.length === commentTarget.length) {
      setCommentDone(true);
      return;
    }
    const t = setTimeout(() => {
      setCommentText(commentTarget.slice(0, commentText.length + 1));
    }, COMMENT_TYPE_SPEED);
    return () => clearTimeout(t);
  }, [index, startCommentTyping, commentText, commentTarget]);

  const slides: SlideRenderer[] = [
    ({ next }) => (
      <div className={css.slide}>
        <h2 className={css.slideTitle}>Create Pull Request</h2>
        <p className={css.slideDesc}>
          Open a PR. Every PR must be “funded” with your karma balance before it can merge. A
          funding check will run automatically next.
        </p>
        <Button onClick={next} className={css.primaryBtn} /* removed radialOut + hover handlers */>
          Create Pull Request
        </Button>
      </div>
    ),
    ({ next }) => (
      <div className={`${css.slide} ${css.leftAlign}`}>
        <h2 className={css.slideTitle} style={{ textAlign: 'center' }}>
          Funding Check Failed
        </h2>
        <p className={css.slideDesc} style={{ textAlign: 'center' }}>
          This PR can’t proceed because your balance (0) is below the required 100 karma points.
          Earn karma by reviewing teammates’ PRs, then try again.
        </p>
        <GitHubCheck variant="failed" currentBalance={0} requiredBalance={100} />
        <div className={css.actions}>
          <Button onClick={next} className={css.primaryBtn}>
            Go Earn Karma (Review PR)
          </Button>
        </div>
      </div>
    ),
    ({ next }) => (
      <div className={`${css.slide} ${css.leftAlign}`}>
        <h2 className={css.slideTitle} style={{ textAlign: 'center' }}>
          Review a Teammate’s PR to Earn Karma
        </h2>
        <p className={css.slideDesc} style={{ textAlign: 'center' }}>
          Approving quality work on someone else’s PR rewards you with karma. That balance funds
          your own PRs.
        </p>
        <div className={css.inputRow}>
          <Avatar
            size={40}
            radius="sm"
            className={css.avatar}
            src="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
          />
          <div className={css.reviewBox} aria-label="Review comment input (simulated)">
            <div className={css.reviewInput}>
              {reviewText}
              {!reviewDone && <span className={css.cursor} />}
            </div>
          </div>
        </div>
        <div className={css.actions}>
          <Button
            onClick={next}
            className={`${css.primaryBtn} ${!reviewDone ? css.approveBtnDisabled : ''}`}
            disabled={!reviewDone}
          >
            Approve PR
          </Button>
        </div>
      </div>
    ),
    ({ next }) => (
      <div className={css.slide}>
        <h1 className={css.slideTitle} style={{ margin: 0 }}>
          You’ve gained +100 karma points 🎉
        </h1>
        <p className={css.slideDesc}>
          Your review was submitted. The earned karma is now in your balance and can fund your PR.
        </p>
        <Button onClick={next} className={css.primaryBtn} style={{ marginTop: 24 }}>
          Return to Original PR
        </Button>
      </div>
    ),
    ({ next }) => (
      <div className={`${css.slide}`}>
        <h2 className={css.slideTitle}>Re-trigger the Funding Check</h2>
        <p className={css.slideDesc}>
          Post a ✨ comment to ask gitkarma to re-run the funding check using your new balance.
        </p>
        <div className={css.inputRow}>
          <Avatar
            size={40}
            radius="sm"
            className={css.avatar}
            src="https://github.com/mantinedev/mantine/blob/master/.demo/avatars/avatar-2.png?raw=true"
          />
          <div className={css.reviewBox} aria-label="PR comment input (simulated)">
            <div className={css.reviewInput}>
              {commentText}
              {!commentDone && <span className={css.cursor} />}
            </div>
          </div>
        </div>
        <div className={css.actions}>
          <Button
            onClick={next}
            className={`${css.primaryBtn} ${!commentDone ? css.approveBtnDisabled : ''}`}
            disabled={!commentDone}
          >
            Comment ✨
          </Button>
        </div>
      </div>
    ),
    ({ restart }) => (
      <div className={css.slide}>
        <h1 className={css.slideTitle} style={{ margin: 0 }}>
          Funding Successful! 🎯
        </h1>
        <p className={css.slideDesc}>
          Your updated balance passed the check. Required karma was deducted; the PR is now eligible
          to merge.
        </p>
        <GitHubCheck variant="completed" oldBalance={100} mergePenalty={100} newBalance={0} />
        <Button onClick={restart} className={css.primaryBtn} style={{ marginTop: 24 }}>
          Restart Demo
        </Button>
      </div>
    ),
  ];

  const stepLabels = [
    'Open PR',
    'Check Fails',
    'Review Teammate',
    'Karma Earned',
    'Re-run Check',
    'Funded',
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        next();
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next]);

  return (
    <>
      <header aria-label="User journey walkthrough introduction" style={{ textAlign: 'center' }}>
        <Title mb="sm" className={css.title}>
          How does GitKarma work?
        </Title>
        <Text mb="lg">
          <span className={css.slideDesc} style={{ marginTop: 0 }}>
            Interactive walkthrough of how GitKarma funds and validates a PR.
          </span>
        </Text>
      </header>

      {/* Progress steps (outside animated height container) */}
      <div className={css.progressBar} role="list" aria-label="Funding journey progress">
        {stepLabels.map((label, i) => {
          const stateClass = i < index ? css.segDone : i === index ? css.segActive : css.segTodo;
          return (
            <Text
              key={label}
              role="listitem"
              className={`${css.progressSegment} ${stateClass}`}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`${label} (${i < index ? 'completed' : i === index ? 'current step' : 'upcoming'})`}
            >
              <span className={css.segLabel}>{label}</span>
              {i < stepLabels.length - 1 && <span className={css.segDivider} aria-hidden="true" />}
            </Text>
          );
        })}
      </div>
      <div
        className={css.container}
        aria-label="Demo slideshow"
        style={{
          // Height here is the content box height; padding (from CSS) sits outside it
          height: containerHeight,
          overflow: 'hidden',
          transition: animateHeight ? 'height 300ms ease' : undefined,
        }}
      >
        <div ref={contentRef}>
          <Fade key={index} direction="down" triggerOnce>
            {slides[index]({ next, restart })}
          </Fade>
        </div>
      </div>
    </>
  );
};

export default Demo;
