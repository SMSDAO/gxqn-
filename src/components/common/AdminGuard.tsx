import React from 'react';
import { SmartWalletUser } from '../../services/smartWallet';

export const AdminGuard: React.FC<{ user: SmartWalletUser | null; children: React.ReactNode }> = ({ user, children }) => {
  if (user?.email !== 'gxqstudio@gmail.com') {
    return <div className="p-10 text-center text-red-500 font-mono">Unauthorized: Super Admin Access Required</div>;
  }
  return <>{children}</>;
};
