import './InputField.scss'
import { useState } from 'react'

export default function InputField({
  label,
  hint,
  error,
  as = 'input',
  type = 'text',
  allowPasswordToggle = false,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  name,
  id,
  required,
}) {
  const controlId = id || name
  const Tag = as
  const [passwordVisible, setPasswordVisible] = useState(false)
  const canTogglePassword = Tag === 'input' && type === 'password' && allowPasswordToggle
  const effectiveType = canTogglePassword ? (passwordVisible ? 'text' : 'password') : type

  return (
    <label className="inputField" htmlFor={controlId}>
      {label ? <div className="inputField__label">{label}</div> : null}
      <div className="inputField__controlRow">
        <Tag
          className={
            error ? 'inputField__control inputField__control--error' : 'inputField__control'
          }
          id={controlId}
          name={name}
          type={Tag === 'input' ? effectiveType : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />
        {canTogglePassword ? (
          <button
            type="button"
            className="inputField__toggle"
            onClick={() => setPasswordVisible((v) => !v)}
            disabled={disabled}
          >
            {passwordVisible ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {error ? <div className="inputField__error">{error}</div> : null}
      {!error && hint ? <div className="inputField__hint">{hint}</div> : null}
    </label>
  )
}
