import { clearAllIndexedDbState } from '../store/persistence';
import { syncUserDataToFirestore } from './firebase';
export const persistSnapshotByPlan = async (args) => {
    if (args.storageMode === 'temporary')
        return;
    await syncUserDataToFirestore(args.uid, args.snapshot, Boolean(args.isAdmin));
};
export const handlePlanAwareLogout = async (args) => {
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
