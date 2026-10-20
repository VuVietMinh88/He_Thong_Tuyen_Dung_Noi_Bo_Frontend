export type BackendFeature = 'schedules' | 'scheduleWrites' | 'participantPicker' | 'evaluations' | 'reopening' | 'assignedProfile' | 'bulkScheduling';
export type CapabilityStatus = 'AVAILABLE' | 'NOT_IMPLEMENTED' | 'ERROR' | 'NOT_VERIFIED';

// Release-specific, public build configuration. Missing/invalid evidence fails closed.
// HTTP errors never mutate this manifest or become NOT_IMPLEMENTED automatically.
export function featureStatus(feature: BackendFeature): CapabilityStatus {
  try {
    const manifest = JSON.parse(import.meta.env.VITE_BACKEND_CAPABILITIES || '{}');
    const api = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');
    if (manifest.apiBaseUrl !== api || !/^[a-f0-9]{64}$/.test(manifest.backendSha256 || '')
        || !Number.isFinite(Date.parse(manifest.verifiedAt))) return 'NOT_VERIFIED';
    const status = manifest.features?.[feature];
    // These adapters are deliberately not implemented in this Frontend release.
    if ((feature === 'bulkScheduling' || feature === 'assignedProfile') && status === 'AVAILABLE') return 'NOT_VERIFIED';
    return ['AVAILABLE', 'NOT_IMPLEMENTED', 'ERROR', 'NOT_VERIFIED'].includes(status) ? status : 'NOT_VERIFIED';
  } catch { return 'NOT_VERIFIED'; }
}
export function capabilityMessage(status: CapabilityStatus): string {
  if (status === 'NOT_IMPLEMENTED') return 'Chức năng này hiện chưa được Backend hỗ trợ';
  if (status === 'ERROR') return 'Chức năng này đang gặp lỗi. Cần xử lý nguyên nhân trước khi sử dụng.';
  if (status === 'NOT_VERIFIED') return 'Chức năng này chưa được xác minh với Backend đang triển khai. Thao tác tạm thời bị vô hiệu hóa.';
  return '';
}
export class BackendCapabilityError extends Error {
  readonly statusCode: number;
  readonly capabilityStatus: CapabilityStatus;
  constructor(capabilityStatus: CapabilityStatus) {
    super(capabilityMessage(capabilityStatus));
    this.capabilityStatus = capabilityStatus;
    this.name = 'BackendCapabilityError';
    this.statusCode = capabilityStatus === 'NOT_IMPLEMENTED' ? 501 : 503;
  }
}
export function requireFeature(feature: BackendFeature): void {
  const status = featureStatus(feature);
  if (status !== 'AVAILABLE') throw new BackendCapabilityError(status);
}
