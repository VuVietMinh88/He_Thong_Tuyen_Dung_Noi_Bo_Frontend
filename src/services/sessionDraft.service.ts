import { tokenService } from './token.service';

const SESSION_DRAFT_KEY = 'sessionExpiryDraft';
const SESSION_RETURN_TO_KEY = 'sessionExpiryReturnTo';

interface SavedControl {
  index: number;
  kind: 'value' | 'checked' | 'selected';
  value: string | boolean | string[];
}

interface SavedForm {
  index: number;
  controls: SavedControl[];
}

export interface SessionDraftDialog {
  type: string;
  id?: string;
}

interface SessionDraft {
  returnTo: string;
  userId: string;
  forms: SavedForm[];
  dialog?: SessionDraftDialog;
}

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export interface SensitiveFieldDescriptor {
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
}

const isSavedControl = (value: unknown): value is SavedControl =>
  typeof value === 'object'
  && value !== null
  && 'index' in value
  && typeof value.index === 'number'
  && Number.isInteger(value.index)
  && value.index >= 0
  && 'kind' in value
  && (value.kind === 'value' || value.kind === 'checked' || value.kind === 'selected')
  && 'value' in value
  && (
    typeof value.value === 'string'
    || typeof value.value === 'boolean'
    || Array.isArray(value.value) && value.value.every((item: unknown) => typeof item === 'string')
  );

const isSavedForm = (value: unknown): value is SavedForm =>
  typeof value === 'object'
  && value !== null
  && 'index' in value
  && typeof value.index === 'number'
  && Number.isInteger(value.index)
  && value.index >= 0
  && 'controls' in value
  && Array.isArray(value.controls)
  && value.controls.every(isSavedControl);

const isSessionDraft = (value: unknown): value is SessionDraft => {
  if (
    typeof value !== 'object'
    || value === null
    || !('returnTo' in value)
    || typeof value.returnTo !== 'string'
    || !('userId' in value)
    || typeof value.userId !== 'string'
    || !('forms' in value)
    || !Array.isArray(value.forms)
  ) return false;

  if (!value.forms.every(isSavedForm)) return false;
  if (!('dialog' in value) || value.dialog === undefined) return true;
  return typeof value.dialog === 'object'
    && value.dialog !== null
    && 'type' in value.dialog
    && typeof value.dialog.type === 'string'
    && (!('id' in value.dialog) || value.dialog.id === undefined || typeof value.dialog.id === 'string');
};

export const hasSessionExpiryDraft = (): boolean => {
  try {
    return window.sessionStorage.getItem(SESSION_DRAFT_KEY) !== null;
  } catch {
    return false;
  }
};

const isFormControl = (element: Element): element is FormControl =>
  element instanceof HTMLInputElement
  || element instanceof HTMLSelectElement
  || element instanceof HTMLTextAreaElement;

export const isSensitiveField = ({
  type = '',
  name = '',
  id = '',
  autocomplete = '',
}: SensitiveFieldDescriptor): boolean =>
  ['password', 'hidden', 'file', 'submit', 'reset', 'button', 'image'].includes(type.toLowerCase())
  || /password|token|secret|otp|one.?time.?code|verification.?code|cc-number/i.test(
    `${name} ${id} ${autocomplete}`,
  );

export const isSensitiveFormControl = (control: FormControl): boolean =>
  isSensitiveField({
    type: control instanceof HTMLInputElement ? control.type : '',
    name: control.name,
    id: control.id,
    autocomplete: control.getAttribute('autocomplete') ?? '',
  });

export const captureSessionExpiryDraft = (
  returnTo: string,
  forms: HTMLFormElement[] = typeof document === 'undefined' ? [] : Array.from(document.forms),
): boolean => {
  const userId = tokenService.getUserData()?.id;
  if (!userId) return false;
  const activeDialog = typeof document === 'undefined'
    ? null
    : document.querySelector<HTMLElement>('[role="dialog"][data-session-draft-type]');
  const dialogType = activeDialog?.dataset.sessionDraftType;
  const dialog = dialogType
    ? { type: dialogType, id: activeDialog.dataset.sessionDraftId }
    : undefined;
  const savedForms: SavedForm[] = forms.map((form, formIndex) => ({
    index: formIndex,
    controls: Array.from(form.elements)
      .flatMap((element, index): SavedControl[] => {
        if (!isFormControl(element) || isSensitiveFormControl(element) || element.disabled) return [];
        if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) {
          return [{ index, kind: 'checked', value: element.checked }];
        }
        if (element instanceof HTMLSelectElement && element.multiple) {
          return [{
            index,
            kind: 'selected',
            value: Array.from(element.selectedOptions, (option) => option.value),
          }];
        }
        return [{ index, kind: 'value', value: element.value }];
      }),
  })).filter((form) => form.controls.length > 0);

  if (!savedForms.length && !dialog) return false;
  try {
    const draft: SessionDraft = { returnTo, userId, forms: savedForms, dialog };
    window.sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft));
    window.sessionStorage.setItem(SESSION_RETURN_TO_KEY, returnTo);
    return true;
  } catch {
    return false;
  }
};

export const getSessionExpiryDialog = (userId: string): SessionDraftDialog | null => {
  try {
    const serialized = window.sessionStorage.getItem(SESSION_DRAFT_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    if (
      typeof parsed !== 'object'
      || parsed === null
      || !('dialog' in parsed)
      || !('userId' in parsed)
      || parsed.userId !== userId
      || typeof parsed.dialog !== 'object'
      || parsed.dialog === null
      || !('type' in parsed.dialog)
      || typeof parsed.dialog.type !== 'string'
    ) return null;
    return {
      type: parsed.dialog.type,
      id: 'id' in parsed.dialog && typeof parsed.dialog.id === 'string'
        ? parsed.dialog.id
        : undefined,
    };
  } catch {
    return null;
  }
};

export const getSessionExpiryReturnTo = (userId: string): string | null => {
  try {
    const path = window.sessionStorage.getItem(SESSION_RETURN_TO_KEY);
    if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/login')) return null;
    const serializedDraft = window.sessionStorage.getItem(SESSION_DRAFT_KEY);
    const parsed: unknown = serializedDraft ? JSON.parse(serializedDraft) : null;
    if (!isSessionDraft(parsed) || parsed.userId !== userId || parsed.returnTo !== path) {
      window.sessionStorage.removeItem(SESSION_DRAFT_KEY);
      window.sessionStorage.removeItem(SESSION_RETURN_TO_KEY);
      return null;
    }
    return path;
  } catch {
    return null;
  }
};

export const clearSessionExpiryReturnTo = (): void => {
  try {
    window.sessionStorage.removeItem(SESSION_RETURN_TO_KEY);
  } catch {
    // The saved form values are retained until the destination form is restored.
  }
};

const setNativeControlValue = (control: FormControl, saved: SavedControl): void => {
  if (saved.kind === 'checked' && control instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set;
    setter?.call(control, saved.value);
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (saved.kind === 'selected' && control instanceof HTMLSelectElement && Array.isArray(saved.value)) {
    const selectedValues = saved.value;
    Array.from(control.options).forEach((option) => {
      option.selected = selectedValues.includes(option.value);
    });
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  if (saved.kind !== 'value' || typeof saved.value !== 'string') return;
  const prototype = control instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(control, saved.value);
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
};

export const restoreSessionExpiryDraft = (
  currentPath: string,
  forms: HTMLFormElement[] = Array.from(document.forms),
): boolean => {
  let draft: SessionDraft;
  try {
    const serialized = window.sessionStorage.getItem(SESSION_DRAFT_KEY);
    if (!serialized) return false;
    const parsed: unknown = JSON.parse(serialized);
    if (
      !isSessionDraft(parsed)
      || parsed.returnTo !== currentPath
      || parsed.userId !== tokenService.getUserData()?.id
    ) return false;
    draft = parsed;
  } catch {
    return false;
  }

  const canRestoreForms = draft.forms.every((savedForm) => Boolean(forms[savedForm.index]));
  if (!canRestoreForms) return false;
  const controlsAreReady = draft.forms.every((savedForm) => {
    const form = forms[savedForm.index];
    return savedForm.controls.every((savedControl) => {
      const control = form?.elements.item(savedControl.index);
      return control !== null && control !== undefined && isFormControl(control);
    });
  });
  if (!controlsAreReady) return false;

  draft.forms.forEach((savedForm) => {
    const form = forms[savedForm.index];
    if (!form) return;
    savedForm.controls.forEach((savedControl) => {
      const control = form.elements.item(savedControl.index);
      if (control && isFormControl(control) && !isSensitiveFormControl(control)) {
        setNativeControlValue(control, savedControl);
      }
    });
  });
  try {
    window.sessionStorage.removeItem(SESSION_DRAFT_KEY);
    window.sessionStorage.removeItem(SESSION_RETURN_TO_KEY);
  } catch {
    return false;
  }
  return true;
};
