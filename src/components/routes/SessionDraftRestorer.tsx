import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tokenService } from '../../services/token.service';
import {
  getSessionExpiryDialog,
  hasSessionExpiryDraft,
  restoreSessionExpiryDraft,
  type SessionDraftDialog,
} from '../../services/sessionDraft.service';

const openSessionDraftDialog = (detail: SessionDraftDialog): void => {
  window.dispatchEvent(new CustomEvent<SessionDraftDialog>('session-draft:restore-dialog', { detail }));
};

const SessionDraftRestorer = () => {
  const location = useLocation();

  useEffect(() => {
    if (!hasSessionExpiryDraft()) return undefined;
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const currentUserId = tokenService.getUserData()?.id;
    if (!currentUserId) return undefined;
    let dialogOpened = false;
    const retryInterval = window.setInterval(() => {
      const dialog = getSessionExpiryDialog(currentUserId);
      if (dialog && !dialogOpened) {
        dialogOpened = true;
        openSessionDraftDialog(dialog);
      }
      if (restoreSessionExpiryDraft(currentPath)) window.clearInterval(retryInterval);
    }, 200);
    const timeout = window.setTimeout(() => window.clearInterval(retryInterval), 20000);
    return () => {
      window.clearInterval(retryInterval);
      window.clearTimeout(timeout);
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default SessionDraftRestorer;
