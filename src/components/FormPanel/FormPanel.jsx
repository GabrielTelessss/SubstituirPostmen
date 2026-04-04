import './FormPanel.scss'
import { useMemo, useRef, useState } from 'react'
import useFormState from '../../hooks/useFormState.js'
import useLocalStorage from '../../hooks/useLocalStorage.js'
import buildJson from '../../utils/buildJson.js'
import { maskCep, maskCnpj, maskCpf, maskTelefone } from '../../utils/masks.js'
import Accordion from '../shared/Accordion.jsx'
import InputField from '../shared/InputField.jsx'
import RadioGroup from '../shared/RadioGroup.jsx'
import CheckboxField from '../shared/CheckboxField.jsx'
import Modal from '../shared/Modal.jsx'
import CopyButton from '../shared/CopyButton.jsx'

export default function FormPanel({ onSend, sending = false }) {
  const { formState, setField, setFormState, reset } = useFormState()
  const draftStorage = useLocalStorage('nfse_rascunho')
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)
  const certificadoInputRef = useRef(null)

  function maskCnpjCpf(value) {
    const digits = String(value || '').replace(/\D/g, '')
    if (digits.length > 11) return maskCnpj(value)
    return maskCpf(value)
  }

  const jsonPreview = useMemo(() => JSON.stringify(buildJson(formState), null, 2), [formState])

  function sanitizeForStorage(value) {
    const next = structuredClone(value)
    if (next.configuracao) next.configuracao.authorization = ''
    if (next.parametrosNFSe) next.parametrosNFSe.senha = ''
    if (next.parametrosNFSe) next.parametrosNFSe.senhaCertificado = ''
    if (next.parametrosNFSe) next.parametrosNFSe.certificado = ''
    return next
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
  }

  function deepMerge(base, incoming) {
    if (Array.isArray(incoming)) return incoming
    if (!isPlainObject(incoming)) return incoming
    const next = Array.isArray(base) ? [] : { ...base }
    for (const key of Object.keys(incoming)) {
      const inValue = incoming[key]
      const baseValue = base ? base[key] : undefined
      if (isPlainObject(inValue) && isPlainObject(baseValue)) {
        next[key] = deepMerge(baseValue, inValue)
      } else {
        next[key] = inValue
      }
    }
    return next
  }

  function normalizeImportedPayload(payload) {
    if (!payload) return null
    if (payload.value && typeof payload.value === 'object') return payload.value
    return payload
  }

  function toDigits(value) {
    return String(value || '').replace(/\D/g, '')
  }

  function toDatetimeLocal(value) {
    if (!value) return ''
    const d = new Date(value)
    if (!Number.isFinite(d.getTime())) return ''
    return d.toISOString().slice(0, 16)
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const normalized = String(value).replace(/\s/g, '').replace(',', '.')
    const num = Number(normalized)
    return Number.isFinite(num) ? num : 0
  }

  function convertFromApiPayload(payload) {
    const first = payload?.listaNotaFiscalServico?.[0]
    const firstItem = first?.listaNotaFiscalServicoItens?.[0]

    const converted = {}

    if (payload?.loteRps?.numeroLote !== undefined) {
      converted.loteRps = {
        numeroLote: String(payload.loteRps.numeroLote ?? ''),
        xmlRespostaLote: payload.loteRps.xmlRespostaLote || '',
        protocoloLote: payload.loteRps.protocoloLote || '',
        statusDoLote: toNumber(payload.loteRps.statusDoLote),
        descricaoStatusDoLote: payload.loteRps.descricaoStatusDoLote || '',
        dataRecebimento: payload.loteRps.dataRecebimento || '1900-01-01T00:00:00Z',
      }
    }

    if (payload?.prestadorServico && typeof payload.prestadorServico === 'object') {
      converted.prestadorServico = {
        cnpj: maskCnpj(toDigits(payload.prestadorServico.cnpj)),
        razaoSocial: payload.prestadorServico.razaoSocial || '',
        fantasia: payload.prestadorServico.fantasia || '',
        email: payload.prestadorServico.email || '',
        telefone: payload.prestadorServico.telefone || '',
        inscricaoEstadual: payload.prestadorServico.inscricaoEstadual || '',
        inscricaoMunicipal: payload.prestadorServico.inscricaoMunicipal || '',
        idEmpresaCredenciada: payload.prestadorServico.idEmpresaCredenciada || '',
        simples: Boolean(payload.prestadorServico.simples),
        incentivoCultural: Boolean(payload.prestadorServico.incentivoCultural),
        endereco: {
          logradouro: payload.prestadorServico.endereco?.logradouro || '',
          numero: payload.prestadorServico.endereco?.numero || '',
          complemento: payload.prestadorServico.endereco?.complemento || '',
          bairro: payload.prestadorServico.endereco?.bairro || '',
          cidade: payload.prestadorServico.endereco?.cidade || '',
          estado: payload.prestadorServico.endereco?.estado || '',
          cep: maskCep(toDigits(payload.prestadorServico.endereco?.cep)),
          ibge: payload.prestadorServico.endereco?.ibge || '',
        },
      }
    }

    if (payload?.parametrosNFSe && typeof payload.parametrosNFSe === 'object') {
      converted.configuracao = {
        ambiente: Number(payload.parametrosNFSe.ambiente) || 2,
      }
      converted.parametrosNFSe = {
        serieRps: payload.parametrosNFSe.serieRPS || payload.parametrosNFSe.serieRps || '',
        regimeEspecial: payload.parametrosNFSe.regimeEspecial || '',
        tipoRecolhimentoIss: payload.parametrosNFSe.tipoRecolhimentoIss || '',
        aliqIssSimples: String(payload.parametrosNFSe.aliqIssSimples ?? ''),
        usuario: payload.parametrosNFSe.usuario || '',
        senha: payload.parametrosNFSe.senha || '',
        certificado: payload.parametrosNFSe.certificado || '',
        senhaCertificado: payload.parametrosNFSe.senhaCertificado || '',
        idCertificadoCredenciado: payload.parametrosNFSe.idCertificadoCredenciado || '',
        urlProducao: payload.parametrosNFSe.urlProducao || '',
        urlHomologacao: payload.parametrosNFSe.urlHomologacao || '',
        aceitaIssZerado: Boolean(payload.parametrosNFSe.aceitaISSZerado ?? payload.parametrosNFSe.aceitaIssZerado),
        exibeVencimento: Boolean(payload.parametrosNFSe.exibeVencimento),
        usaLeiTransparenciaFiscal: Boolean(payload.parametrosNFSe.usaLeiTransparenciaFiscal),
        usaEnvioEmail: Boolean(payload.parametrosNFSe.usaEnvioEmail),
        usaPadraoNfseNacional: Boolean(payload.parametrosNFSe.UsaPadraoNfseNacional ?? payload.parametrosNFSe.usaPadraoNfseNacional),
        removerInscricaoMunicipal: Boolean(payload.parametrosNFSe.RemoverInscricaoMunicipal ?? payload.parametrosNFSe.removerInscricaoMunicipal),
      }
    }

    if (first && typeof first === 'object') {
      converted.notaFiscal = {
        numeroRps: String(first.numeroRps ?? ''),
        serieRps: first.serieRps || '',
        dataEmissao: toDatetimeLocal(first.dataEmissao),
        status: first.status || '',
        textoNF: first.textoNF || '',
        motivoCancelamento: first.motivoCancelamento || '',
        dataCancelamento: toDatetimeLocal(first.dataCancelamento),
        valorBruto: String(first.valorBruto ?? ''),
        deducoes: String(first.deducoes ?? ''),
        descontos: String(first.descontos ?? ''),
        tipSerCodigo: String(first.tipSerCodigo ?? ''),
        codigoObra: first.codigoObra || '',
        art: first.art || '',
        atividade: first.atividade || '',
        nbs: first.nbs || '',
        cnae: first.cnae || '',
        naturezaOperacao: first.naturezaOperacao || '',
        emailEnvioNFSe: first.emailEnvioNFSe || '',
        ibgeMunicipioIncidencia: first.ibgeMunicipioIncidencia || '',
        tomador: {
          cnpjCpf: maskCnpjCpf(toDigits(first.cnpjCpf)),
          nomeRazao: first.nomeRazao || '',
          fantasia: first.fantasia || '',
          inscricaoEstadual: first.inscricaoEstadual || '',
          inscricaoMunicipal: first.inscricaoMunicipal || '',
          telefone: first.fone || '',
          endereco: {
            logradouro: first.endereco?.logradouro || '',
            numero: first.endereco?.numero || '',
            complemento: first.endereco?.complemento || '',
            bairro: first.endereco?.bairro || '',
            cidade: first.endereco?.cidade || '',
            estado: first.endereco?.estado || '',
            cep: maskCep(toDigits(first.endereco?.cep)),
            ibge: first.endereco?.ibge || '',
          },
        },
        enderecoPrestacaoServico: {
          logradouro: first.enderecoPrestacaoServico?.logradouro || '',
          numero: first.enderecoPrestacaoServico?.numero || '',
          complemento: first.enderecoPrestacaoServico?.complemento || '',
          bairro: first.enderecoPrestacaoServico?.bairro || '',
          cidade: first.enderecoPrestacaoServico?.cidade || '',
          estado: first.enderecoPrestacaoServico?.estado || '',
          cep: maskCep(toDigits(first.enderecoPrestacaoServico?.cep)),
          ibge: first.enderecoPrestacaoServico?.ibge || '',
        },
        tributos: {
          issqn: {
            base: String(firstItem?.baseISSQN ?? ''),
            percentual: String(firstItem?.percISSQN ?? ''),
            valor: toNumber(firstItem?.valorISSQN ?? first.valorISSQN),
          },
          pis: {
            base: String(firstItem?.basePIS ?? ''),
            percentual: String(firstItem?.percPIS ?? ''),
            valor: toNumber(firstItem?.valorPIS ?? first.valorPIS),
          },
          cofins: {
            base: String(firstItem?.baseCOFINS ?? ''),
            percentual: String(firstItem?.percCOFINS ?? ''),
            valor: toNumber(firstItem?.valorCOFINS ?? first.valorCOFINS),
          },
          csll: {
            base: String(firstItem?.baseCSLL ?? ''),
            percentual: String(firstItem?.percCSLL ?? ''),
            valor: toNumber(firstItem?.valorCSLL ?? first.valorCSLL),
          },
          inss: {
            base: String(firstItem?.baseINSS ?? ''),
            percentual: String(firstItem?.percINSS ?? ''),
            valor: toNumber(firstItem?.valorINSS ?? first.valorINSS),
          },
          irrf: {
            base: String(firstItem?.baseIRPF ?? ''),
            percentual: String(firstItem?.percIRPF ?? ''),
            valor: toNumber(firstItem?.valorIRPF ?? first.valorIRRF),
          },
        },
        flagsTributos: {
          deduzIssqn: Boolean(firstItem?.deduzISSQN),
          deduzIrpf: Boolean(firstItem?.deduzIRPF),
          deduzInss: Boolean(firstItem?.deduzINSS),
          deduzPis: Boolean(firstItem?.deduzPIS),
          deduzCofins: Boolean(firstItem?.deduzCOFINS),
          deduzCsll: Boolean(firstItem?.deduzCSLL),
          ocultarValorIssqn: Boolean(firstItem?.ocultarValorISSQN),
          ocultarAliquotaIssqn: Boolean(firstItem?.ocultarAliquotaISSQN),
        },
        item: {
          descricao: firstItem?.descricao || '',
          quantidade: String(firstItem?.quantidade ?? ''),
          valorUnitario:
            String(firstItem?.quantidade ? toNumber(firstItem?.valor) / toNumber(firstItem?.quantidade) : firstItem?.valor ?? ''),
          codigoServico: String(firstItem?.tipSerCodigo ?? ''),
        },
      }
    }

    return converted
  }

  function applyImportedPayload(raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      const imported = normalizeImportedPayload(parsed)
      if (!imported || typeof imported !== 'object') throw new Error('JSON inválido')
      const toApply =
        Array.isArray(imported.listaNotaFiscalServico) ? convertFromApiPayload(imported) : imported
      setFormState((prev) => deepMerge(prev, toApply))
      setImportError('')
      setImportModalOpen(false)
    } catch {
      setImportError('Não foi possível importar. Verifique se o JSON está válido.')
    }
  }

  function exportJsonToFile() {
    const blob = new Blob([jsonPreview], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.href = url
    a.download = `nfse-rascunho-${timestamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleSelectCertificadoFile(file) {
    if (!file) return
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    setField(['parametrosNFSe', 'certificado'], base64)
  }

  return (
    <div className="formPanel">
      <div className="formPanel__sections">
        <Accordion title="Configuração da Requisição" defaultOpen>
          <div className="formPanel__grid">
            <InputField
              label="URL da API"
              name="url"
              value={formState.configuracao.url}
              onChange={(e) => setField(['configuracao', 'url'], e.target.value)}
            />
            <InputField
              label="Authorization"
              name="authorization"
              type="password"
              allowPasswordToggle
              value={formState.configuracao.authorization}
              onChange={(e) => setField(['configuracao', 'authorization'], e.target.value)}
            />
            <RadioGroup
              label="Ambiente"
              name="ambiente"
              value={formState.configuracao.ambiente}
              onChange={(e) => setField(['configuracao', 'ambiente'], Number(e.target.value))}
              options={[
                { label: 'Produção', value: 1 },
                { label: 'Homologação', value: 2 },
              ]}
            />
          </div>
        </Accordion>

        <Accordion title="Lote RPS">
          <div className="formPanel__grid">
            <InputField
              label="Número do Lote"
              name="numeroLote"
              type="number"
              value={formState.loteRps.numeroLote}
              onChange={(e) => setField(['loteRps', 'numeroLote'], e.target.value)}
            />
            <InputField
              label="XML Resposta do Lote"
              name="xmlRespostaLote"
              as="textarea"
              readOnly
              value={formState.loteRps.xmlRespostaLote}
              onChange={() => {}}
              placeholder="<!-- vazio -->"
            />
            <InputField
              label="Protocolo do Lote"
              name="protocoloLote"
              readOnly
              value={formState.loteRps.protocoloLote}
              onChange={() => {}}
            />
            <InputField
              label="Status do Lote"
              name="statusDoLote"
              type="number"
              readOnly
              value={formState.loteRps.statusDoLote}
              onChange={() => {}}
            />
            <InputField
              label="Descrição Status do Lote"
              name="descricaoStatusDoLote"
              readOnly
              value={formState.loteRps.descricaoStatusDoLote}
              onChange={() => {}}
            />
            <InputField
              label="Data Recebimento"
              name="dataRecebimento"
              readOnly
              value={formState.loteRps.dataRecebimento}
              onChange={() => {}}
            />
          </div>
        </Accordion>

        <Accordion title="Prestador de Serviço">
          <div className="formPanel__grid">
            <InputField
              label="CNPJ"
              name="prestadorCnpj"
              value={formState.prestadorServico.cnpj}
              onChange={(e) => setField(['prestadorServico', 'cnpj'], maskCnpj(e.target.value))}
            />
            <InputField
              label="Razão Social"
              name="prestadorRazaoSocial"
              value={formState.prestadorServico.razaoSocial}
              onChange={(e) => setField(['prestadorServico', 'razaoSocial'], e.target.value)}
            />
            <InputField
              label="Nome Fantasia"
              name="prestadorFantasia"
              value={formState.prestadorServico.fantasia}
              onChange={(e) => setField(['prestadorServico', 'fantasia'], e.target.value)}
            />
            <InputField
              label="Email"
              name="prestadorEmail"
              type="email"
              value={formState.prestadorServico.email}
              onChange={(e) => setField(['prestadorServico', 'email'], e.target.value)}
            />
            <InputField
              label="Telefone"
              name="prestadorTelefone"
              value={formState.prestadorServico.telefone}
              onChange={(e) => setField(['prestadorServico', 'telefone'], maskTelefone(e.target.value))}
            />
            <InputField
              label="Inscrição Estadual"
              name="prestadorInscricaoEstadual"
              value={formState.prestadorServico.inscricaoEstadual}
              onChange={(e) => setField(['prestadorServico', 'inscricaoEstadual'], e.target.value)}
            />
            <InputField
              label="Inscrição Municipal"
              name="prestadorInscricaoMunicipal"
              value={formState.prestadorServico.inscricaoMunicipal}
              onChange={(e) => setField(['prestadorServico', 'inscricaoMunicipal'], e.target.value)}
            />
            <InputField
              label="ID Empresa Credenciada"
              name="prestadorIdEmpresaCredenciada"
              value={formState.prestadorServico.idEmpresaCredenciada}
              onChange={(e) => setField(['prestadorServico', 'idEmpresaCredenciada'], e.target.value)}
            />

            <div className="formPanel__row">
              <CheckboxField
                label="Simples Nacional"
                name="prestadorSimples"
                checked={formState.prestadorServico.simples}
                onChange={(e) => setField(['prestadorServico', 'simples'], e.target.checked)}
              />
              <CheckboxField
                label="Incentivo Cultural"
                name="prestadorIncentivoCultural"
                checked={formState.prestadorServico.incentivoCultural}
                onChange={(e) => setField(['prestadorServico', 'incentivoCultural'], e.target.checked)}
              />
            </div>

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Endereço</div>
            <InputField
              label="Logradouro"
              name="prestadorEnderecoLogradouro"
              value={formState.prestadorServico.endereco.logradouro}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'logradouro'], e.target.value)}
            />
            <InputField
              label="Número"
              name="prestadorEnderecoNumero"
              value={formState.prestadorServico.endereco.numero}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'numero'], e.target.value)}
            />
            <InputField
              label="Complemento"
              name="prestadorEnderecoComplemento"
              value={formState.prestadorServico.endereco.complemento}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'complemento'], e.target.value)}
            />
            <InputField
              label="Bairro"
              name="prestadorEnderecoBairro"
              value={formState.prestadorServico.endereco.bairro}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'bairro'], e.target.value)}
            />
            <InputField
              label="Cidade"
              name="prestadorEnderecoCidade"
              value={formState.prestadorServico.endereco.cidade}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'cidade'], e.target.value)}
            />
            <InputField
              label="Estado"
              name="prestadorEnderecoEstado"
              value={formState.prestadorServico.endereco.estado}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'estado'], e.target.value)}
            />
            <InputField
              label="CEP"
              name="prestadorEnderecoCep"
              value={formState.prestadorServico.endereco.cep}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'cep'], maskCep(e.target.value))}
            />
            <InputField
              label="IBGE"
              name="prestadorEnderecoIbge"
              value={formState.prestadorServico.endereco.ibge}
              onChange={(e) => setField(['prestadorServico', 'endereco', 'ibge'], e.target.value)}
            />
          </div>
        </Accordion>

        <Accordion title="Parâmetros NFS-e">
          <div className="formPanel__grid">
            <InputField
              label="Série RPS"
              name="parametrosSerieRps"
              value={formState.parametrosNFSe.serieRps}
              onChange={(e) => setField(['parametrosNFSe', 'serieRps'], e.target.value)}
            />
            <InputField
              label="Regime Especial"
              name="parametrosRegimeEspecial"
              value={formState.parametrosNFSe.regimeEspecial}
              onChange={(e) => setField(['parametrosNFSe', 'regimeEspecial'], e.target.value)}
            />
            <InputField
              label="Tipo Recolhimento ISS"
              name="parametrosTipoRecolhimentoIss"
              value={formState.parametrosNFSe.tipoRecolhimentoIss}
              onChange={(e) => setField(['parametrosNFSe', 'tipoRecolhimentoIss'], e.target.value)}
            />
            <InputField
              label="Alíquota ISS Simples"
              name="parametrosAliqIssSimples"
              type="number"
              value={formState.parametrosNFSe.aliqIssSimples}
              onChange={(e) => setField(['parametrosNFSe', 'aliqIssSimples'], e.target.value)}
            />

            <div className="formPanel__divider" />

            <InputField
              label="Usuário"
              name="parametrosUsuario"
              value={formState.parametrosNFSe.usuario}
              onChange={(e) => setField(['parametrosNFSe', 'usuario'], e.target.value)}
            />
            <InputField
              label="Senha"
              name="parametrosSenha"
              type="password"
              allowPasswordToggle
              value={formState.parametrosNFSe.senha}
              onChange={(e) => setField(['parametrosNFSe', 'senha'], e.target.value)}
            />
            <InputField
              label="Senha do Certificado"
              name="parametrosSenhaCertificado"
              type="password"
              allowPasswordToggle
              value={formState.parametrosNFSe.senhaCertificado}
              onChange={(e) => setField(['parametrosNFSe', 'senhaCertificado'], e.target.value)}
            />
            <div className="formPanel__row">
              <button
                type="button"
                className="formPanel__button"
                onClick={() => certificadoInputRef.current?.click()}
              >
                Selecionar Certificado
              </button>
              <div className="formPanel__certInfo">
                {formState.parametrosNFSe.certificado
                  ? `Certificado carregado (${formState.parametrosNFSe.certificado.length} chars)`
                  : 'Nenhum certificado carregado'}
              </div>
            </div>
            <InputField
              label="ID Certificado Credenciado"
              name="parametrosIdCertificadoCredenciado"
              value={formState.parametrosNFSe.idCertificadoCredenciado}
              onChange={(e) => setField(['parametrosNFSe', 'idCertificadoCredenciado'], e.target.value)}
            />
            <InputField
              label="URL Produção"
              name="parametrosUrlProducao"
              value={formState.parametrosNFSe.urlProducao}
              onChange={(e) => setField(['parametrosNFSe', 'urlProducao'], e.target.value)}
            />
            <InputField
              label="URL Homologação"
              name="parametrosUrlHomologacao"
              value={formState.parametrosNFSe.urlHomologacao}
              onChange={(e) => setField(['parametrosNFSe', 'urlHomologacao'], e.target.value)}
            />

            <div className="formPanel__divider" />

            <div className="formPanel__row">
              <CheckboxField
                label="Aceita ISS Zerado"
                name="parametrosAceitaIssZerado"
                checked={formState.parametrosNFSe.aceitaIssZerado}
                onChange={(e) => setField(['parametrosNFSe', 'aceitaIssZerado'], e.target.checked)}
              />
              <CheckboxField
                label="Exibe Vencimento"
                name="parametrosExibeVencimento"
                checked={formState.parametrosNFSe.exibeVencimento}
                onChange={(e) => setField(['parametrosNFSe', 'exibeVencimento'], e.target.checked)}
              />
              <CheckboxField
                label="Usa Lei Transparência Fiscal"
                name="parametrosUsaLeiTransparenciaFiscal"
                checked={formState.parametrosNFSe.usaLeiTransparenciaFiscal}
                onChange={(e) =>
                  setField(['parametrosNFSe', 'usaLeiTransparenciaFiscal'], e.target.checked)
                }
              />
              <CheckboxField
                label="Usa Envio Email"
                name="parametrosUsaEnvioEmail"
                checked={formState.parametrosNFSe.usaEnvioEmail}
                onChange={(e) => setField(['parametrosNFSe', 'usaEnvioEmail'], e.target.checked)}
              />
              <CheckboxField
                label="Usa Padrão NFS-e Nacional"
                name="parametrosUsaPadraoNfseNacional"
                checked={formState.parametrosNFSe.usaPadraoNfseNacional}
                onChange={(e) =>
                  setField(['parametrosNFSe', 'usaPadraoNfseNacional'], e.target.checked)
                }
              />
              <CheckboxField
                label="Remover Inscrição Municipal"
                name="parametrosRemoverInscricaoMunicipal"
                checked={formState.parametrosNFSe.removerInscricaoMunicipal}
                onChange={(e) =>
                  setField(['parametrosNFSe', 'removerInscricaoMunicipal'], e.target.checked)
                }
              />
            </div>
          </div>
        </Accordion>

        <Accordion title="Nota Fiscal">
          <div className="formPanel__grid">
            <InputField
              label="Número RPS"
              name="notaNumeroRps"
              type="number"
              value={formState.notaFiscal.numeroRps}
              onChange={(e) => setField(['notaFiscal', 'numeroRps'], e.target.value)}
            />
            <InputField
              label="Série RPS"
              name="notaSerieRps"
              value={formState.notaFiscal.serieRps}
              onChange={(e) => setField(['notaFiscal', 'serieRps'], e.target.value)}
            />
            <InputField
              label="Data Emissão"
              name="notaDataEmissao"
              type="datetime-local"
              value={formState.notaFiscal.dataEmissao}
              onChange={(e) => setField(['notaFiscal', 'dataEmissao'], e.target.value)}
            />
            <InputField
              label="Status"
              name="notaStatus"
              value={formState.notaFiscal.status}
              onChange={(e) => setField(['notaFiscal', 'status'], e.target.value)}
            />
            <InputField
              label="Texto NF"
              name="notaTextoNF"
              as="textarea"
              value={formState.notaFiscal.textoNF}
              onChange={(e) => setField(['notaFiscal', 'textoNF'], e.target.value)}
              placeholder="Digite o texto/observações da NF"
            />

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Cancelamento</div>
            <InputField
              label="Motivo Cancelamento"
              name="notaMotivoCancelamento"
              as="textarea"
              value={formState.notaFiscal.motivoCancelamento}
              onChange={(e) => setField(['notaFiscal', 'motivoCancelamento'], e.target.value)}
              placeholder="Motivo do cancelamento (quando aplicável)"
            />
            <InputField
              label="Data Cancelamento"
              name="notaDataCancelamento"
              type="datetime-local"
              value={formState.notaFiscal.dataCancelamento}
              onChange={(e) => setField(['notaFiscal', 'dataCancelamento'], e.target.value)}
            />

            <div className="formPanel__divider" />

            <InputField
              label="Valor Bruto"
              name="notaValorBruto"
              type="number"
              value={formState.notaFiscal.valorBruto}
              onChange={(e) => setField(['notaFiscal', 'valorBruto'], e.target.value)}
            />
            <InputField
              label="Deduções"
              name="notaDeducoes"
              type="number"
              value={formState.notaFiscal.deducoes}
              onChange={(e) => setField(['notaFiscal', 'deducoes'], e.target.value)}
            />
            <InputField
              label="Descontos"
              name="notaDescontos"
              type="number"
              value={formState.notaFiscal.descontos}
              onChange={(e) => setField(['notaFiscal', 'descontos'], e.target.value)}
            />
            <InputField
              label="SubTotal (calculado)"
              name="notaSubTotal"
              type="number"
              readOnly
              value={formState.notaFiscal.subTotal}
              onChange={() => {}}
            />

            <div className="formPanel__divider" />

            <InputField
              label="Código do Serviço / tipSerCodigo"
              name="notaTipSerCodigo"
              value={formState.notaFiscal.tipSerCodigo}
              onChange={(e) => setField(['notaFiscal', 'tipSerCodigo'], e.target.value)}
            />
            <InputField
              label="Código Obra"
              name="notaCodigoObra"
              value={formState.notaFiscal.codigoObra}
              onChange={(e) => setField(['notaFiscal', 'codigoObra'], e.target.value)}
            />
            <InputField
              label="ART"
              name="notaArt"
              value={formState.notaFiscal.art}
              onChange={(e) => setField(['notaFiscal', 'art'], e.target.value)}
            />
            <InputField
              label="Atividade"
              name="notaAtividade"
              value={formState.notaFiscal.atividade}
              onChange={(e) => setField(['notaFiscal', 'atividade'], e.target.value)}
            />
            <InputField
              label="NBS"
              name="notaNbs"
              value={formState.notaFiscal.nbs}
              onChange={(e) => setField(['notaFiscal', 'nbs'], e.target.value)}
            />
            <InputField
              label="CNAE"
              name="notaCnae"
              value={formState.notaFiscal.cnae}
              onChange={(e) => setField(['notaFiscal', 'cnae'], e.target.value)}
            />
            <InputField
              label="Natureza Operação"
              name="notaNaturezaOperacao"
              value={formState.notaFiscal.naturezaOperacao}
              onChange={(e) => setField(['notaFiscal', 'naturezaOperacao'], e.target.value)}
            />
            <InputField
              label="Email Envio NFS-e"
              name="notaEmailEnvioNFSe"
              type="email"
              value={formState.notaFiscal.emailEnvioNFSe}
              onChange={(e) => setField(['notaFiscal', 'emailEnvioNFSe'], e.target.value)}
            />
            <InputField
              label="IBGE Município Incidência"
              name="notaIbgeMunicipioIncidencia"
              value={formState.notaFiscal.ibgeMunicipioIncidencia}
              onChange={(e) => setField(['notaFiscal', 'ibgeMunicipioIncidencia'], e.target.value)}
            />

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Tomador</div>
            <InputField
              label="CNPJ/CPF"
              name="tomadorCnpjCpf"
              value={formState.notaFiscal.tomador.cnpjCpf}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'cnpjCpf'], maskCnpjCpf(e.target.value))}
            />
            <InputField
              label="Nome/Razão Social"
              name="tomadorNomeRazao"
              value={formState.notaFiscal.tomador.nomeRazao}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'nomeRazao'], e.target.value)}
            />
            <InputField
              label="Fantasia"
              name="tomadorFantasia"
              value={formState.notaFiscal.tomador.fantasia}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'fantasia'], e.target.value)}
            />
            <InputField
              label="Inscrição Estadual"
              name="tomadorInscricaoEstadual"
              value={formState.notaFiscal.tomador.inscricaoEstadual}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'inscricaoEstadual'], e.target.value)}
            />
            <InputField
              label="Inscrição Municipal"
              name="tomadorInscricaoMunicipal"
              value={formState.notaFiscal.tomador.inscricaoMunicipal}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'inscricaoMunicipal'], e.target.value)}
            />
            <InputField
              label="Telefone"
              name="tomadorTelefone"
              value={formState.notaFiscal.tomador.telefone}
              onChange={(e) =>
                setField(['notaFiscal', 'tomador', 'telefone'], maskTelefone(e.target.value))
              }
            />

            <div className="formPanel__subTitle">Endereço do Tomador</div>
            <InputField
              label="Logradouro"
              name="tomadorEnderecoLogradouro"
              value={formState.notaFiscal.tomador.endereco.logradouro}
              onChange={(e) =>
                setField(['notaFiscal', 'tomador', 'endereco', 'logradouro'], e.target.value)
              }
            />
            <InputField
              label="Número"
              name="tomadorEnderecoNumero"
              value={formState.notaFiscal.tomador.endereco.numero}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'endereco', 'numero'], e.target.value)}
            />
            <InputField
              label="Complemento"
              name="tomadorEnderecoComplemento"
              value={formState.notaFiscal.tomador.endereco.complemento}
              onChange={(e) =>
                setField(['notaFiscal', 'tomador', 'endereco', 'complemento'], e.target.value)
              }
            />
            <InputField
              label="Bairro"
              name="tomadorEnderecoBairro"
              value={formState.notaFiscal.tomador.endereco.bairro}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'endereco', 'bairro'], e.target.value)}
            />
            <InputField
              label="Cidade"
              name="tomadorEnderecoCidade"
              value={formState.notaFiscal.tomador.endereco.cidade}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'endereco', 'cidade'], e.target.value)}
            />
            <InputField
              label="Estado"
              name="tomadorEnderecoEstado"
              value={formState.notaFiscal.tomador.endereco.estado}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'endereco', 'estado'], e.target.value)}
            />
            <InputField
              label="CEP"
              name="tomadorEnderecoCep"
              value={formState.notaFiscal.tomador.endereco.cep}
              onChange={(e) =>
                setField(['notaFiscal', 'tomador', 'endereco', 'cep'], maskCep(e.target.value))
              }
            />
            <InputField
              label="IBGE"
              name="tomadorEnderecoIbge"
              value={formState.notaFiscal.tomador.endereco.ibge}
              onChange={(e) => setField(['notaFiscal', 'tomador', 'endereco', 'ibge'], e.target.value)}
            />

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Endereço de Prestação do Serviço</div>
            <InputField
              label="Logradouro"
              name="prestacaoLogradouro"
              value={formState.notaFiscal.enderecoPrestacaoServico.logradouro}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'logradouro'], e.target.value)
              }
            />
            <InputField
              label="Número"
              name="prestacaoNumero"
              value={formState.notaFiscal.enderecoPrestacaoServico.numero}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'numero'], e.target.value)
              }
            />
            <InputField
              label="Complemento"
              name="prestacaoComplemento"
              value={formState.notaFiscal.enderecoPrestacaoServico.complemento}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'complemento'], e.target.value)
              }
            />
            <InputField
              label="Bairro"
              name="prestacaoBairro"
              value={formState.notaFiscal.enderecoPrestacaoServico.bairro}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'bairro'], e.target.value)
              }
            />
            <InputField
              label="Cidade"
              name="prestacaoCidade"
              value={formState.notaFiscal.enderecoPrestacaoServico.cidade}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'cidade'], e.target.value)
              }
            />
            <InputField
              label="Estado"
              name="prestacaoEstado"
              value={formState.notaFiscal.enderecoPrestacaoServico.estado}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'estado'], e.target.value)
              }
            />
            <InputField
              label="CEP"
              name="prestacaoCep"
              value={formState.notaFiscal.enderecoPrestacaoServico.cep}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'cep'], maskCep(e.target.value))
              }
            />
            <InputField
              label="IBGE"
              name="prestacaoIbge"
              value={formState.notaFiscal.enderecoPrestacaoServico.ibge}
              onChange={(e) =>
                setField(['notaFiscal', 'enderecoPrestacaoServico', 'ibge'], e.target.value)
              }
            />

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Tributos</div>

            <div className="formPanel__grid3">
              <InputField
                label="ISSQN Base"
                name="tributoIssqnBase"
                type="number"
                value={formState.notaFiscal.tributos.issqn.base}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'issqn', 'base'], e.target.value)}
              />
              <InputField
                label="ISSQN %"
                name="tributoIssqnPerc"
                type="number"
                value={formState.notaFiscal.tributos.issqn.percentual}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'issqn', 'percentual'], e.target.value)
                }
              />
              <InputField
                label="ISSQN Valor"
                name="tributoIssqnValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.issqn.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__grid3">
              <InputField
                label="PIS Base"
                name="tributoPisBase"
                type="number"
                value={formState.notaFiscal.tributos.pis.base}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'pis', 'base'], e.target.value)}
              />
              <InputField
                label="PIS %"
                name="tributoPisPerc"
                type="number"
                value={formState.notaFiscal.tributos.pis.percentual}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'pis', 'percentual'], e.target.value)}
              />
              <InputField
                label="PIS Valor"
                name="tributoPisValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.pis.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__grid3">
              <InputField
                label="COFINS Base"
                name="tributoCofinsBase"
                type="number"
                value={formState.notaFiscal.tributos.cofins.base}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'cofins', 'base'], e.target.value)
                }
              />
              <InputField
                label="COFINS %"
                name="tributoCofinsPerc"
                type="number"
                value={formState.notaFiscal.tributos.cofins.percentual}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'cofins', 'percentual'], e.target.value)
                }
              />
              <InputField
                label="COFINS Valor"
                name="tributoCofinsValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.cofins.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__grid3">
              <InputField
                label="CSLL Base"
                name="tributoCsllBase"
                type="number"
                value={formState.notaFiscal.tributos.csll.base}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'csll', 'base'], e.target.value)}
              />
              <InputField
                label="CSLL %"
                name="tributoCsllPerc"
                type="number"
                value={formState.notaFiscal.tributos.csll.percentual}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'csll', 'percentual'], e.target.value)
                }
              />
              <InputField
                label="CSLL Valor"
                name="tributoCsllValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.csll.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__grid3">
              <InputField
                label="INSS Base"
                name="tributoInssBase"
                type="number"
                value={formState.notaFiscal.tributos.inss.base}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'inss', 'base'], e.target.value)}
              />
              <InputField
                label="INSS %"
                name="tributoInssPerc"
                type="number"
                value={formState.notaFiscal.tributos.inss.percentual}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'inss', 'percentual'], e.target.value)
                }
              />
              <InputField
                label="INSS Valor"
                name="tributoInssValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.inss.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__grid3">
              <InputField
                label="IRRF Base"
                name="tributoIrrfBase"
                type="number"
                value={formState.notaFiscal.tributos.irrf.base}
                onChange={(e) => setField(['notaFiscal', 'tributos', 'irrf', 'base'], e.target.value)}
              />
              <InputField
                label="IRRF %"
                name="tributoIrrfPerc"
                type="number"
                value={formState.notaFiscal.tributos.irrf.percentual}
                onChange={(e) =>
                  setField(['notaFiscal', 'tributos', 'irrf', 'percentual'], e.target.value)
                }
              />
              <InputField
                label="IRRF Valor"
                name="tributoIrrfValor"
                type="number"
                readOnly
                value={formState.notaFiscal.tributos.irrf.valor}
                onChange={() => {}}
              />
            </div>

            <div className="formPanel__subTitle">Flags de Tributos</div>
            <div className="formPanel__row">
              <CheckboxField
                label="Deduz ISSQN"
                name="flagDeduzIssqn"
                checked={formState.notaFiscal.flagsTributos.deduzIssqn}
                onChange={(e) => setField(['notaFiscal', 'flagsTributos', 'deduzIssqn'], e.target.checked)}
              />
              <CheckboxField
                label="Deduz IRPF"
                name="flagDeduzIrpf"
                checked={formState.notaFiscal.flagsTributos.deduzIrpf}
                onChange={(e) => setField(['notaFiscal', 'flagsTributos', 'deduzIrpf'], e.target.checked)}
              />
              <CheckboxField
                label="Deduz INSS"
                name="flagDeduzInss"
                checked={formState.notaFiscal.flagsTributos.deduzInss}
                onChange={(e) => setField(['notaFiscal', 'flagsTributos', 'deduzInss'], e.target.checked)}
              />
              <CheckboxField
                label="Deduz PIS"
                name="flagDeduzPis"
                checked={formState.notaFiscal.flagsTributos.deduzPis}
                onChange={(e) => setField(['notaFiscal', 'flagsTributos', 'deduzPis'], e.target.checked)}
              />
              <CheckboxField
                label="Deduz COFINS"
                name="flagDeduzCofins"
                checked={formState.notaFiscal.flagsTributos.deduzCofins}
                onChange={(e) =>
                  setField(['notaFiscal', 'flagsTributos', 'deduzCofins'], e.target.checked)
                }
              />
              <CheckboxField
                label="Deduz CSLL"
                name="flagDeduzCsll"
                checked={formState.notaFiscal.flagsTributos.deduzCsll}
                onChange={(e) => setField(['notaFiscal', 'flagsTributos', 'deduzCsll'], e.target.checked)}
              />
              <CheckboxField
                label="Ocultar Valor ISSQN"
                name="flagOcultarValorIssqn"
                checked={formState.notaFiscal.flagsTributos.ocultarValorIssqn}
                onChange={(e) =>
                  setField(['notaFiscal', 'flagsTributos', 'ocultarValorIssqn'], e.target.checked)
                }
              />
              <CheckboxField
                label="Ocultar Alíquota ISSQN"
                name="flagOcultarAliquotaIssqn"
                checked={formState.notaFiscal.flagsTributos.ocultarAliquotaIssqn}
                onChange={(e) =>
                  setField(['notaFiscal', 'flagsTributos', 'ocultarAliquotaIssqn'], e.target.checked)
                }
              />
            </div>

            <div className="formPanel__divider" />

            <div className="formPanel__subTitle">Item da NFS-e</div>
            <InputField
              label="Descrição"
              name="itemDescricao"
              value={formState.notaFiscal.item.descricao}
              onChange={(e) => setField(['notaFiscal', 'item', 'descricao'], e.target.value)}
            />
            <InputField
              label="Quantidade"
              name="itemQuantidade"
              type="number"
              value={formState.notaFiscal.item.quantidade}
              onChange={(e) => setField(['notaFiscal', 'item', 'quantidade'], e.target.value)}
            />
            <InputField
              label="Valor Unitário"
              name="itemValorUnitario"
              type="number"
              value={formState.notaFiscal.item.valorUnitario}
              onChange={(e) => setField(['notaFiscal', 'item', 'valorUnitario'], e.target.value)}
            />
            <InputField
              label="Código Serviço"
              name="itemCodigoServico"
              value={formState.notaFiscal.item.codigoServico}
              onChange={(e) => setField(['notaFiscal', 'item', 'codigoServico'], e.target.value)}
            />
          </div>
        </Accordion>
      </div>

      <div className="formPanel__actions">
        <button
          type="button"
          className="formPanel__button"
          disabled={sending}
          onClick={() => onSend?.({ url: formState.configuracao.url, authorization: formState.configuracao.authorization, payload: buildJson(formState) })}
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
        <button type="button" className="formPanel__button" onClick={() => setJsonModalOpen(true)}>
          Ver JSON
        </button>
        <button type="button" className="formPanel__button" onClick={exportJsonToFile}>
          Exportar JSON
        </button>
        <button
          type="button"
          className="formPanel__button"
          onClick={() => {
            setImportText('')
            setImportError('')
            setImportModalOpen(true)
          }}
        >
          Importar JSON
        </button>
        <button
          type="button"
          className="formPanel__button"
          onClick={() => draftStorage.save(sanitizeForStorage(formState))}
        >
          Salvar Rascunho
        </button>
        <button
          type="button"
          className="formPanel__button"
          onClick={() => {
            const loaded = draftStorage.load()
            if (loaded) setFormState(loaded)
          }}
        >
          Carregar Rascunho
        </button>
        <button
          type="button"
          className="formPanel__button"
          onClick={() => {
            reset()
            setImportText('')
            setImportError('')
          }}
        >
          Limpar
        </button>
        <button type="button" className="formPanel__button" onClick={() => draftStorage.clear()}>
          Apagar Rascunho
        </button>
        {draftStorage.lastSavedAt ? (
          <div className="formPanel__lastSaved">Último rascunho: {new Date(draftStorage.lastSavedAt).toLocaleString()}</div>
        ) : null}
      </div>

      <Modal open={jsonModalOpen} title="JSON montado" onClose={() => setJsonModalOpen(false)}>
        <div className="formPanel__modalActions">
          <CopyButton text={jsonPreview} />
        </div>
        <pre className="formPanel__json">{jsonPreview}</pre>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="formPanel__fileInput"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const text = await file.text()
          setImportText(text)
          applyImportedPayload(text)
          e.target.value = ''
        }}
      />

      <input
        ref={certificadoInputRef}
        type="file"
        accept=".pfx,.p12,application/x-pkcs12"
        className="formPanel__fileInput"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          await handleSelectCertificadoFile(file)
          e.target.value = ''
        }}
      />

      <Modal open={importModalOpen} title="Importar JSON" onClose={() => setImportModalOpen(false)}>
        <div className="formPanel__modalActions">
          <button
            type="button"
            className="formPanel__button"
            onClick={() => fileInputRef.current?.click()}
          >
            Selecionar arquivo
          </button>
          <button
            type="button"
            className="formPanel__button"
            onClick={() => applyImportedPayload(importText)}
          >
            Aplicar
          </button>
        </div>
        <InputField
          label="Cole o JSON aqui"
          as="textarea"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          error={importError}
          placeholder='Cole um JSON gerado pelo "Exportar JSON" ou "Ver JSON"'
        />
      </Modal>
    </div>
  )
}
