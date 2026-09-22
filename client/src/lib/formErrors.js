/**
 * Copies the API's field-level errors onto a React Hook Form instance.
 * Returns a message to show in a form-level alert when the error isn't tied to a field.
 */
export function applyServerErrors(error, setError) {
  const details = error?.details ?? [];
  details.forEach(({ field, message }) => {
    if (field) setError(field, { type: 'server', message });
  });
  return details.length > 0 ? null : (error?.message ?? 'Something went wrong. Please try again.');
}

/** Removes empty values so we never send `category=` (which the API rightly rejects). */
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  );
}
