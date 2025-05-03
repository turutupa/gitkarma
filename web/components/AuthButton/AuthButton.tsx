import { useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Avatar, Button, Menu } from '@mantine/core';
import { GithubIcon } from '@mantinex/dev-icons';
import css from './AuthButton.module.css';

const AuthButton = () => {
  const { data: session, status } = useSession();

  const onSignIn = useCallback(() => {
    signIn('github', { callbackUrl: '/admin' });
  }, [signIn]);

  const onSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  if (status === 'loading') {
    return null;
  }

  if (session) {
    return (
      <Menu withArrow arrowPosition="side" offset={10}>
        <Menu.Target>
          <Avatar
            src={session.user?.image || ''}
            alt={session.user?.name || 'GitHub User'}
            radius="xl"
            size={38}
            style={{ cursor: 'pointer' }}
          />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onSignOut}>Log Out</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Button
      size="xs"
      fs="md"
      leftSection={<GithubIcon size={16} />}
      className={css.githubButton}
      onClick={onSignIn}
    >
      Login with GitHub
    </Button>
  );
};

export default AuthButton;
