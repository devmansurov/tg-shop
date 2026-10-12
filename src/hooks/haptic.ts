import { hapticFeedback } from '@tma.js/sdk-react';

export function tap() {
  hapticFeedback.selectionChanged.ifAvailable();
}

export function success() {
  hapticFeedback.notificationOccurred.ifAvailable('success');
}
