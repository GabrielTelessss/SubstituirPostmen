function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const normalized = String(value).replace(/\s/g, '').replace(',', '.')
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function round2(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
}

export function calcularSubTotal(valorBruto, deducoes, descontos) {
  return round2(toNumber(valorBruto) - toNumber(deducoes) - toNumber(descontos))
}

export function calcularTributo(base, percentual) {
  return round2((toNumber(base) * toNumber(percentual)) / 100)
}
