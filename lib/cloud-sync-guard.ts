type WorkspaceIdentity = { membership?: { userId?: number | null } | null } | null | undefined;

/** Không hydrate/push snapshot cũ nếu cache workspace chưa kịp chuyển sang user mới. */
export function workspaceBelongsToUser(workspace: WorkspaceIdentity, userId: number | null | undefined): boolean {
  return Boolean(userId && workspace?.membership?.userId === userId);
}
