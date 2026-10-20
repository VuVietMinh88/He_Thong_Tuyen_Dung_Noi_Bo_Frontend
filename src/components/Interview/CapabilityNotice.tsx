import { capabilityMessage, featureStatus, type BackendFeature } from '../../services/backendCapabilities';
export function CapabilityNotice({ feature }: { feature: BackendFeature }) {
  const status = featureStatus(feature);
  return status === 'AVAILABLE' ? null : <p role="status" data-capability={feature} data-capability-status={status}>
    {capabilityMessage(status)}
  </p>;
}
