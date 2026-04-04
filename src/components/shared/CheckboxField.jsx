import './CheckboxField.scss'

export default function CheckboxField({ label, checked, onChange, name, id, disabled }) {
  const controlId = id || name

  return (
    <label className="checkboxField" htmlFor={controlId}>
      <input
        id={controlId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="checkboxField__label">{label}</span>
    </label>
  )
}
