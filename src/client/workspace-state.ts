export {
  hasListDiff,
  markListDiff,
  clearListDiff,
  hasWorkspaceModified,
  markWorkspaceModified,
  clearWorkspaceModified,
  getKnownWorkspacePathsSnapshot,
  restoreWorkspaceAuxiliaryState,
  updateWorkspaceListDiff,
  removeWorkspaceTracking,
} from './workspace-state-diff';

export {
  markWorkspacePathMissing,
  clearWorkspacePathMissing,
  isWorkspacePathMissing,
  getWorkspaceMissingPaths,
} from './workspace-state-missing';
