import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useApiInstance } from '@/utils/useAPI';
import { useSessionStorage } from '@/utils/useSessionStorage';
import { http } from '../utils/http';

type RepoContextType = {
  currentRepoGithubId: number | null;
  setCurrentRepoGithubId: (repo: number | null) => void;
};

const RepoContext = createContext<RepoContextType>({
  currentRepoGithubId: null,
  setCurrentRepoGithubId: () => {},
});

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
