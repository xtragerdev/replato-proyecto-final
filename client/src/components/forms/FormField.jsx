export function FormField({ id, label, error, hint, children }) {
  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">{error}</p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>{hint}</p>
      ) : null}
    </div>
  )
}
