import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      currentBranch,
      setCurrentBranch,
      currentUser,
      setCurrentUser,
      toast,
      showToast
    }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);