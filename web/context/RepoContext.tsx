import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useApiInstance } from '@/src/utils/useAPI';
import { useSessionStorage } from '@/src/utils/useSessionStorage';
import { http } from '../src/utils/http';

type RepoContextType = {
  currentRepoGithubId: number | null;
  setCurrentRepoGithubId: (repo: number | null) => void;
};

const RepoContext = createContext<RepoContextType>({
  currentRepoGithubId: null,
  setCurrentRepoGithubId: () => {},
});

/**
 * Provides the current repository context to the application.
 * Manages the `currentRepoGithubId` state using session storage and updates HTTP headers accordingly.
 *
 * @param children - The child components to be wrapped by the provider.
 * @returns A context provider for repository-related state.
 */
export const RepoProvider = ({ children }: { children: ReactNode }) => {
  const [currentRepoGithubId, setCurrentRepoGithubId] = useSessionStorage<number | null>(
    'currentRepo',
    null
  );

  useEffect(() => {
    if (currentRepoGithubId) {
      http.defaults.headers.common.repoId = currentRepoGithubId;
      useApiInstance.defaults.headers.common.repoId = currentRepoGithubId;
    } else {
      delete http.defaults.headers.common.repoId;
      delete useApiInstance.defaults.headers.common.repoId;
    }
  }, [currentRepoGithubId]);

  return (
    <RepoContext.Provider value={{ currentRepoGithubId, setCurrentRepoGithubId }}>
      {children}
    </RepoContext.Provider>
  );
};

export const useRepoContext = () => useContext(RepoContext);
