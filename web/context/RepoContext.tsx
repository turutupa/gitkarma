import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { TRepoAndUsers } from '@/models/UserRepo';
import { useApiInstance } from '@/utils/useAPI';
import { http } from '../utils/http';

type RepoContextType = {
  currentRepo: TRepoAndUsers | null;
  setCurrentRepo: (repo: TRepoAndUsers | null) => void;
};

const RepoContext = createContext<RepoContextType>({ currentRepo: null, setCurrentRepo: () => {} });

export const RepoProvider = ({ children }: { children: ReactNode }) => {
  const [currentRepo, setCurrentRepo] = useState<TRepoAndUsers | null>(null);

  useEffect(() => {
    if (currentRepo) {
      http.defaults.headers.common.repoId = currentRepo.repo_id;
      useApiInstance.defaults.headers.common.repoId = currentRepo.repo_id;
    } else {
      delete http.defaults.headers.common.repoId;
      delete useApiInstance.defaults.headers.common.repoId;
    }
  }, [currentRepo]);

  return (
    <RepoContext.Provider value={{ currentRepo, setCurrentRepo }}>{children}</RepoContext.Provider>
  );
};

export const useRepoContext = () => useContext(RepoContext);
