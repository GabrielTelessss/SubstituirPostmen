import './RadioGroup.scss'

export default function RadioGroup({ label, name, value, options, onChange }) {
  return (
    <fieldset className="radioGroup">
      {label ? <legend className="radioGroup__label">{label}</legend> : null}
      <div className="radioGroup__options">
        {options.map((opt) => (
          <label key={opt.value} className="radioGroup__option">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={String(value) === String(opt.value)}
              onChange={onChange}
            />
            <span className="radioGroup__text">{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
