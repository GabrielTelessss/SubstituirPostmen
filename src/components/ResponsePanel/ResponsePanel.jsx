import './ResponsePanel.scss'
import Accordion from '../shared/Accordion.jsx'
import CopyButton from '../shared/CopyButton.jsx'
import decodeXml from '../../utils/decodeXml.js'
import StatusBadge from './StatusBadge.jsx'

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function coalesce(...values) {
  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') return v
  }
  return ''
}

function deriveStatus({ loading, error, responseData }) {
  if (loading) return 'enviando'
  if (error) return 'rejeitada'
  const statusDoLote = responseData?.loteRps?.statusDoLote
  if (statusDoLote === 1 || statusDoLote === '1') return 'autorizada'
  if (statusDoLote === 2 || statusDoLote === '2') return 'avisos'
  const listaErros = responseData?.listaErros
  if (Array.isArray(listaErros) && listaErros.length > 0) return 'rejeitada'
  if (responseData) return 'autorizada'
  return 'aguardando'
}

function buildDadosNfse(responseData) {
  const firstServico = responseData?.listaNotaFiscalServico?.[0]
  const firstItem = firstServico?.listaNotaFiscalServicoItens?.[0]

  const numeroNfse = coalesce(
    responseData?.numeroNfse,
    responseData?.numeroNFSe,
    responseData?.nfseNumero,
    responseData?.dadosNFSe?.numero,
    firstServico?.numeroNfse,
    firstServico?.numeroNFSe,
    firstServico?.codigo,
  )

  const dataEmissao = coalesce(
    responseData?.dataEmissaoNfse,
    responseData?.dataEmissaoNFSe,
    responseData?.dadosNFSe?.dataEmissao,
    responseData?.dataEmissao,
    firstServico?.dataEmissaoNFSe,
    firstServico?.dataEmissao,
  )

  const codigoVerificacao = coalesce(
    responseData?.codigoVerificacao,
    responseData?.codigoVerificacaoNfse,
    responseData?.codVerificacao,
    responseData?.dadosNFSe?.codigoVerificacao,
  )

  const link = coalesce(
    responseData?.linkNfse,
    responseData?.linkNFSe,
    responseData?.urlNfse,
    responseData?.urlNFSe,
    responseData?.dadosNFSe?.link,
  )

  const valorServico = coalesce(
    responseData?.valorServico,
    responseData?.dadosNFSe?.valorServico,
    firstServico?.subTotal,
    firstServico?.valorServico,
  )

  const valorBruto = coalesce(responseData?.valorBruto, firstServico?.valorBruto)

  const valorIss = coalesce(
    responseData?.valorISSQN,
    responseData?.valorIssqn,
    responseData?.valorISS,
    responseData?.valorIss,
    responseData?.dadosNFSe?.valorISS,
    firstServico?.valorISSQN,
    firstItem?.valorISSQN,
  )

  const aliquotaIss = coalesce(
    responseData?.aliquotaISS,
    responseData?.aliquotaIss,
    responseData?.dadosNFSe?.aliquotaISS,
    firstItem?.percISSQN,
  )

  const hasAny =
    numeroNfse ||
    dataEmissao ||
    codigoVerificacao ||
    link ||
    valorServico !== '' ||
    valorBruto !== '' ||
    valorIss !== '' ||
    aliquotaIss !== ''

  if (!hasAny) return null

  return {
    numeroNfse,
    dataEmissao,
    codigoVerificacao,
    link,
    valorServico,
    valorBruto,
    valorIss,
    aliquotaIss,
  }
}

export default function ResponsePanel({ requestState }) {
  const status = deriveStatus(requestState || {})
  const responseData = requestState?.responseData
  const lote = responseData?.loteRps?.numeroLote ?? responseData?.numeroLote
  const protocolo = responseData?.loteRps?.protocoloLote ?? responseData?.protocoloLote
  const recebimento = responseData?.loteRps?.dataRecebimento ?? responseData?.dataRecebimento
  const descricao = responseData?.loteRps?.descricaoStatusDoLote ?? responseData?.descricaoStatusDoLote
  const listaErros = Array.isArray(responseData?.listaErros) ? responseData.listaErros : []

  const xmlEnviadoRaw = coalesce(
    responseData?.xmlEnvioAssinado,
    responseData?.xmlEnvio,
    responseData?.xmlAssinado,
    responseData?.xml,
  )
  const xmlRespostaRaw = coalesce(responseData?.xmlResposta, responseData?.outputXML)
  const xmlEnviado = decodeXml(xmlEnviadoRaw)
  const xmlResposta = decodeXml(xmlRespostaRaw)

  const jsonRaw = requestState?.error
    ? safeStringify({ error: requestState.error, responseData })
    : safeStringify(responseData || { status: 'aguardando_envio' })

  const dadosNfse = buildDadosNfse(responseData)

  return (
    <div className="responsePanel">
      <div className="responsePanel__header">
        <div className="responsePanel__status">
          <StatusBadge status={status} />
          {typeof requestState?.durationMs === 'number' ? (
            <div className="responsePanel__time">{requestState.durationMs} ms</div>
          ) : null}
        </div>
        <div className="responsePanel__meta">
          <div className="responsePanel__metaItem">Lote: {lote || '—'}</div>
          <div className="responsePanel__metaItem">Protocolo: {protocolo || '—'}</div>
          <div className="responsePanel__metaItem">Recebimento: {recebimento || '—'}</div>
          <div className="responsePanel__metaItem">Status: {descricao || '—'}</div>
        </div>
      </div>

      <div className="responsePanel__sections">
        {requestState?.corsLikely ? (
          <div className="responsePanel__cors">
            CORS/Network Error: se a API não permitir chamadas do navegador, será necessário liberar CORS no servidor ou usar um proxy/back-end.
          </div>
        ) : null}

        {listaErros.length > 0 ? (
          <Accordion title={`Lista de Erros (${listaErros.length})`} defaultOpen>
            <div className="responsePanel__errors">
              {listaErros.map((item, idx) => (
                <div key={`${item?.codigo || 'E'}-${idx}`} className="responsePanel__errorItem">
                  <div className="responsePanel__errorCode">{item?.codigo || `#${idx + 1}`}</div>
                  {item?.mensagem ? <div className="responsePanel__errorMsg">{item.mensagem}</div> : null}
                  {item?.correcao ? <div className="responsePanel__errorFix">{item.correcao}</div> : null}
                  {!item?.mensagem && !item?.correcao ? (
                    <pre className="responsePanel__pre">{safeStringify(item)}</pre>
                  ) : null}
                </div>
              ))}
            </div>
          </Accordion>
        ) : null}

        {dadosNfse ? (
          <Accordion title="Dados NFS-e" defaultOpen>
            <div className="responsePanel__kv">
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Número NFS-e</div>
                <div className="responsePanel__kvVal">{dadosNfse.numeroNfse || '—'}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Data Emissão</div>
                <div className="responsePanel__kvVal">{dadosNfse.dataEmissao || '—'}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Código Verificação</div>
                <div className="responsePanel__kvVal">{dadosNfse.codigoVerificacao || '—'}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Link</div>
                <div className="responsePanel__kvVal">
                  {dadosNfse.link ? (
                    <a className="responsePanel__link" href={dadosNfse.link} target="_blank" rel="noreferrer">
                      Abrir NFS-e
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Valor do Serviço</div>
                <div className="responsePanel__kvVal">{String(dadosNfse.valorServico ?? '—')}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Valor Bruto</div>
                <div className="responsePanel__kvVal">{String(dadosNfse.valorBruto ?? '—')}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Valor ISS</div>
                <div className="responsePanel__kvVal">{String(dadosNfse.valorIss ?? '—')}</div>
              </div>
              <div className="responsePanel__kvItem">
                <div className="responsePanel__kvKey">Alíquota ISS</div>
                <div className="responsePanel__kvVal">{String(dadosNfse.aliquotaIss ?? '—')}</div>
              </div>
            </div>
          </Accordion>
        ) : null}

        <Accordion title="JSON Bruto" defaultOpen>
          <div className="responsePanel__copy">
            <CopyButton text={jsonRaw} />
          </div>
          <pre className="responsePanel__pre">{jsonRaw}</pre>
        </Accordion>
        <Accordion title="XML Enviado">
          <div className="responsePanel__copy">
            <CopyButton text={xmlEnviado || ''} />
          </div>
          <pre className="responsePanel__pre">{xmlEnviado || '<!-- sem XML -->'}</pre>
        </Accordion>
        <Accordion title="XML Resposta">
          <div className="responsePanel__copy">
            <CopyButton text={xmlResposta || ''} />
          </div>
          <pre className="responsePanel__pre">{xmlResposta || '<!-- sem XML -->'}</pre>
        </Accordion>
      </div>
    </div>
  )
}
