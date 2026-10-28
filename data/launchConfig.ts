/**
 * Public launch facts. Never put credentials or candidate data in this file.
 * Replace nulls only with information approved by the Pizza Zio team, then
 * validate the complete notice and the operational handover before approval.
 */
export type LaunchConfiguration = {
  approved: boolean;
  legal: {
    publisherIdentity: string | null;
    registeredOffice: string | null;
    registrationDetails: string | null;
    vatDetails: string | null;
    email: string | null;
    phone: string | null;
    publicationDirector: string | null;
    hostingIdentity: string | null;
    hostingAddress: string | null;
    hostingPhone: string | null;
  };
  privacy: {
    controllerIdentity: string | null;
    controllerAddress: string | null;
    collectedData: string | null;
    legalBasis: string | null;
    recipients: string | null;
    retention: string | null;
    internationalTransfers: string | null;
    rights: string | null;
    rightsContact: string | null;
    technicalProcessing: string | null;
  };
  operations: {
    availableTerritories: string[];
    writtenFollowUpOwnerConfirmed: boolean;
    receivingSystemTested: boolean;
  };
};

export const launchConfig: LaunchConfiguration = {
  approved: false,
  legal: {
    publisherIdentity: null,
    registeredOffice: null,
    registrationDetails: null,
    vatDetails: null,
    email: null,
    phone: null,
    publicationDirector: null,
    hostingIdentity: null,
    hostingAddress: null,
    hostingPhone: null,
  },
  privacy: {
    controllerIdentity: null,
    controllerAddress: null,
    collectedData: null,
    legalBasis: null,
    recipients: null,
    retention: null,
    internationalTransfers: null,
    rights: null,
    rightsContact: null,
    technicalProcessing: null,
  },
  operations: {
    availableTerritories: [],
    writtenFollowUpOwnerConfirmed: false,
    receivingSystemTested: false,
  },
};

function isConfirmedText(value: string | null): boolean {
  return Boolean(value?.trim()) && !/à confirmer|a confirmer|todo|placeholder/i.test(value ?? '');
}

export function getLaunchReadiness(config: LaunchConfiguration) {
  const legalReady = Object.values(config.legal).every(isConfirmedText);
  const privacyReady = Object.values(config.privacy).every(isConfirmedText);
  const operationsReady = config.operations.availableTerritories.length > 0
    && config.operations.availableTerritories.every(isConfirmedText)
    && config.operations.writtenFollowUpOwnerConfirmed
    && config.operations.receivingSystemTested;
  return {
    legalReady,
    privacyReady,
    operationsReady,
    ready: config.approved && legalReady && privacyReady && operationsReady,
  };
}

export const launchReadiness = getLaunchReadiness(launchConfig);
export const PUBLIC_COLLECTION_READY = launchReadiness.ready;
export const PRIVACY_NOTICE_VERSION = '2026-10-28-v1';
