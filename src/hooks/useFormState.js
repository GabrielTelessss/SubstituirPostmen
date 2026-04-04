import { useEffect, useMemo, useState } from 'react'
import { calcularSubTotal, calcularTributo } from '../utils/calculos.js'

function createInitialState() {
  return {
    configuracao: {
      url: 'https://nfse.api.insidesistemas.com.br/v1/loterps/enviar',
      authorization: '',
      ambiente: 2,
    },
    loteRps: {
      numeroLote: '',
      xmlRespostaLote: '',
      protocoloLote: '',
      statusDoLote: 0,
      descricaoStatusDoLote: '',
      dataRecebimento: '1900-01-01T00:00:00Z',
    },
    prestadorServico: {
      cnpj: '',
      razaoSocial: '',
      fantasia: '',
      email: '',
      telefone: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      idEmpresaCredenciada: '',
      simples: false,
      incentivoCultural: false,
      endereco: {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        ibge: '',
      },
    },
    parametrosNFSe: {
      serieRps: '',
      regimeEspecial: '',
      tipoRecolhimentoIss: '',
      aliqIssSimples: '',
      usuario: '',
      senha: '',
      idCertificadoCredenciado: '',
      certificado: '',
      senhaCertificado: '',
      urlProducao: '',
      urlHomologacao: '',
      aceitaIssZerado: false,
      exibeVencimento: false,
      usaLeiTransparenciaFiscal: false,
      usaEnvioEmail: false,
      usaPadraoNfseNacional: false,
      removerInscricaoMunicipal: false,
    },
    notaFiscal: {
      numeroRps: '',
      serieRps: '',
      dataEmissao: '',
      status: '',
      textoNF: '',
      motivoCancelamento: '',
      dataCancelamento: '',
      valorBruto: '',
      deducoes: '',
      descontos: '',
      subTotal: 0,
      tipSerCodigo: '',
      codigoObra: '',
      art: '',
      atividade: '',
      nbs: '',
      cnae: '',
      naturezaOperacao: '',
      emailEnvioNFSe: '',
      ibgeMunicipioIncidencia: '',
      tomador: {
        cnpjCpf: '',
        nomeRazao: '',
        fantasia: '',
        inscricaoEstadual: '',
        inscricaoMunicipal: '',
        telefone: '',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          ibge: '',
        },
      },
      enderecoPrestacaoServico: {
        logradouro: '',
        complemento: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        ibge: '',
      },
      tributos: {
        issqn: { base: '', percentual: '', valor: 0 },
        pis: { base: '', percentual: '', valor: 0 },
        cofins: { base: '', percentual: '', valor: 0 },
        csll: { base: '', percentual: '', valor: 0 },
        inss: { base: '', percentual: '', valor: 0 },
        irrf: { base: '', percentual: '', valor: 0 },
      },
      flagsTributos: {
        deduzIssqn: false,
        deduzIrpf: false,
        deduzInss: false,
        deduzPis: false,
        deduzCofins: false,
        deduzCsll: false,
        ocultarValorIssqn: false,
        ocultarAliquotaIssqn: false,
      },
      item: {
        descricao: '',
        quantidade: '',
        valorUnitario: '',
        codigoServico: '',
      },
    },
  }
}

export default function useFormState() {
  const initialState = useMemo(() => createInitialState(), [])
  const [formState, setFormState] = useState(initialState)

  useEffect(() => {
    const nextBase = formState.notaFiscal.valorBruto === '' ? '' : String(formState.notaFiscal.valorBruto)

    setFormState((prev) => {
      const tributos = prev.notaFiscal.tributos
      if (
        tributos.issqn.base === nextBase &&
        tributos.pis.base === nextBase &&
        tributos.cofins.base === nextBase &&
        tributos.csll.base === nextBase &&
        tributos.inss.base === nextBase &&
        tributos.irrf.base === nextBase
      ) {
        return prev
      }

      const next = structuredClone(prev)
      next.notaFiscal.tributos.issqn.base = nextBase
      next.notaFiscal.tributos.pis.base = nextBase
      next.notaFiscal.tributos.cofins.base = nextBase
      next.notaFiscal.tributos.csll.base = nextBase
      next.notaFiscal.tributos.inss.base = nextBase
      next.notaFiscal.tributos.irrf.base = nextBase
      return next
    })
  }, [formState.notaFiscal.valorBruto])

  useEffect(() => {
    const baseSubTotal = calcularSubTotal(
      formState.notaFiscal.valorBruto,
      formState.notaFiscal.deducoes,
      formState.notaFiscal.descontos,
    )
    const flags = formState.notaFiscal.flagsTributos
    const tributos = formState.notaFiscal.tributos

    const totalTributos =
      (flags.deduzIssqn ? Number(tributos.issqn.valor || 0) : 0) +
      (flags.deduzPis ? Number(tributos.pis.valor || 0) : 0) +
      (flags.deduzCofins ? Number(tributos.cofins.valor || 0) : 0) +
      (flags.deduzCsll ? Number(tributos.csll.valor || 0) : 0) +
      (flags.deduzInss ? Number(tributos.inss.valor || 0) : 0) +
      (flags.deduzIrpf ? Number(tributos.irrf.valor || 0) : 0)
    const computed = Math.round((baseSubTotal - totalTributos + Number.EPSILON) * 100) / 100

    setFormState((prev) => {
      if (prev.notaFiscal.subTotal === computed) return prev
      const next = structuredClone(prev)
      next.notaFiscal.subTotal = computed
      return next
    })
  }, [
    formState.notaFiscal.valorBruto,
    formState.notaFiscal.deducoes,
    formState.notaFiscal.descontos,
    formState.notaFiscal.tributos.issqn.valor,
    formState.notaFiscal.tributos.pis.valor,
    formState.notaFiscal.tributos.cofins.valor,
    formState.notaFiscal.tributos.csll.valor,
    formState.notaFiscal.tributos.inss.valor,
    formState.notaFiscal.tributos.irrf.valor,
    formState.notaFiscal.flagsTributos.deduzIssqn,
    formState.notaFiscal.flagsTributos.deduzPis,
    formState.notaFiscal.flagsTributos.deduzCofins,
    formState.notaFiscal.flagsTributos.deduzCsll,
    formState.notaFiscal.flagsTributos.deduzInss,
    formState.notaFiscal.flagsTributos.deduzIrpf,
  ])

  useEffect(() => {
    const computed = {
      issqn: calcularTributo(
        formState.notaFiscal.tributos.issqn.base,
        formState.notaFiscal.tributos.issqn.percentual,
      ),
      pis: calcularTributo(
        formState.notaFiscal.tributos.pis.base,
        formState.notaFiscal.tributos.pis.percentual,
      ),
      cofins: calcularTributo(
        formState.notaFiscal.tributos.cofins.base,
        formState.notaFiscal.tributos.cofins.percentual,
      ),
      csll: calcularTributo(
        formState.notaFiscal.tributos.csll.base,
        formState.notaFiscal.tributos.csll.percentual,
      ),
      inss: calcularTributo(
        formState.notaFiscal.tributos.inss.base,
        formState.notaFiscal.tributos.inss.percentual,
      ),
      irrf: calcularTributo(
        formState.notaFiscal.tributos.irrf.base,
        formState.notaFiscal.tributos.irrf.percentual,
      ),
    }

    setFormState((prev) => {
      const prevTributos = prev.notaFiscal.tributos
      if (
        prevTributos.issqn.valor === computed.issqn &&
        prevTributos.pis.valor === computed.pis &&
        prevTributos.cofins.valor === computed.cofins &&
        prevTributos.csll.valor === computed.csll &&
        prevTributos.inss.valor === computed.inss &&
        prevTributos.irrf.valor === computed.irrf
      ) {
        return prev
      }

      const next = structuredClone(prev)
      next.notaFiscal.tributos.issqn.valor = computed.issqn
      next.notaFiscal.tributos.pis.valor = computed.pis
      next.notaFiscal.tributos.cofins.valor = computed.cofins
      next.notaFiscal.tributos.csll.valor = computed.csll
      next.notaFiscal.tributos.inss.valor = computed.inss
      next.notaFiscal.tributos.irrf.valor = computed.irrf
      return next
    })
  }, [
    formState.notaFiscal.tributos.issqn.base,
    formState.notaFiscal.tributos.issqn.percentual,
    formState.notaFiscal.tributos.pis.base,
    formState.notaFiscal.tributos.pis.percentual,
    formState.notaFiscal.tributos.cofins.base,
    formState.notaFiscal.tributos.cofins.percentual,
    formState.notaFiscal.tributos.csll.base,
    formState.notaFiscal.tributos.csll.percentual,
    formState.notaFiscal.tributos.inss.base,
    formState.notaFiscal.tributos.inss.percentual,
    formState.notaFiscal.tributos.irrf.base,
    formState.notaFiscal.tributos.irrf.percentual,
  ])

  function setField(path, value) {
    setFormState((prev) => {
      const next = structuredClone(prev)
      let cursor = next
      for (let i = 0; i < path.length - 1; i += 1) {
        cursor = cursor[path[i]]
      }
      cursor[path[path.length - 1]] = value
      return next
    })
  }

  function reset() {
    setFormState(initialState)
  }

  return { formState, setField, setFormState, reset, initialState }
}
