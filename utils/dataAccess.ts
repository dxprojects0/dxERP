import { clearAllIndexedDbState } from '../store/persistence';
import { syncUserDataToFirestore } from './firebase';
import { StorageMode } from './planEngine';

interface PersistArgs {
  uid: string;
  snapshot: any;
  storageMode: StorageMode;
  isAdmin?: boolean;
}

export const persistSnapshotByPlan = async (args: PersistArgs) => {
  if (args.storageMode === 'temporary') return;
  await syncUserDataToFirestore(args.uid, args.snapshot, Boolean(args.isAdmin));
};

interface LogoutArgs extends PersistArgs {}

export const handlePlanAwareLogout = async (args: LogoutArgs) => {
  if (args.storageMode === 'hybrid') {
    await syncUserDataToFirestore(args.uid, args.snapshot, Boolean(args.isAdmin));
    await clearAllIndexedDbState();
    return;
  }

  if (args.storageMode === 'temporary' || args.storageMode === 'persistent') {
    await clearAllIndexedDbState();
    return;
  }
};
