export default function buildJson(formState) {
  function toDigits(value) {
    return String(value || '').replace(/\D/g, '')
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return value
    const normalized = String(value).replace(/\s/g, '').replace(',', '.')
    const num = Number(normalized)
    return Number.isFinite(num) ? num : 0
  }

  function toIsoOrDefault(value, defaultIso) {
    if (!value) return defaultIso
    if (typeof value === 'string' && value.endsWith('Z')) return value
    const d = new Date(value)
    if (!Number.isFinite(d.getTime())) return defaultIso
    return d.toISOString()
  }

  const defaultDate = '1900-01-01T00:00:00Z'
  const serieRps = formState.notaFiscal.serieRps || formState.parametrosNFSe.serieRps || ''

  const valorBruto = toNumber(formState.notaFiscal.valorBruto)
  const deducoes = toNumber(formState.notaFiscal.deducoes)
  const descontos = toNumber(formState.notaFiscal.descontos)

  const tributos = formState.notaFiscal.tributos
  const flags = formState.notaFiscal.flagsTributos

  const itemQuantidade = toNumber(formState.notaFiscal.item.quantidade)
  const itemValorUnitario = toNumber(formState.notaFiscal.item.valorUnitario)
  const itemValor =
    itemQuantidade > 0 && itemValorUnitario > 0 ? itemQuantidade * itemValorUnitario : valorBruto

  const baseISSQN = toNumber(tributos.issqn.base) || valorBruto
  const baseINSS = toNumber(tributos.inss.base) || valorBruto
  const baseIRPF = toNumber(tributos.irrf.base) || valorBruto
  const basePIS = toNumber(tributos.pis.base) || valorBruto
  const baseCOFINS = toNumber(tributos.cofins.base) || valorBruto
  const baseCSLL = toNumber(tributos.csll.base) || valorBruto

  return {
    loteRps: {
      numeroLote: toNumber(formState.loteRps.numeroLote),
      xmlRespostaLote: formState.loteRps.xmlRespostaLote || '',
      protocoloLote: formState.loteRps.protocoloLote || '',
      statusDoLote: toNumber(formState.loteRps.statusDoLote),
      descricaoStatusDoLote: formState.loteRps.descricaoStatusDoLote || '',
      dataRecebimento: toIsoOrDefault(formState.loteRps.dataRecebimento, defaultDate),
    },
    prestadorServico: {
      cnpj: toDigits(formState.prestadorServico.cnpj),
      razaoSocial: formState.prestadorServico.razaoSocial,
      fantasia: formState.prestadorServico.fantasia,
      endereco: {
        logradouro: formState.prestadorServico.endereco.logradouro,
        complemento: formState.prestadorServico.endereco.complemento,
        numero: formState.prestadorServico.endereco.numero,
        bairro: formState.prestadorServico.endereco.bairro,
        cidade: formState.prestadorServico.endereco.cidade,
        estado: formState.prestadorServico.endereco.estado,
        cep: toDigits(formState.prestadorServico.endereco.cep),
        ibge: formState.prestadorServico.endereco.ibge,
      },
      email: formState.prestadorServico.email,
      telefone: formState.prestadorServico.telefone,
      inscricaoEstadual: formState.prestadorServico.inscricaoEstadual,
      inscricaoMunicipal: formState.prestadorServico.inscricaoMunicipal,
      incentivoCultural: formState.prestadorServico.incentivoCultural,
      simples: formState.prestadorServico.simples,
      numeroProcessoSuspendeISS: '',
      idEmpresaCredenciada: formState.prestadorServico.idEmpresaCredenciada,
    },
    parametrosNFSe: {
      quantidadeLote: 1,
      naturezaOperacao: formState.notaFiscal.naturezaOperacao || '',
      regimeEspecial: formState.parametrosNFSe.regimeEspecial,
      tipoRPS: '',
      serieRPS: serieRps,
      timeOut: 0,
      ambiente: Number(formState.configuracao.ambiente) || 2,
      proxyPorta: 0,
      usuario: formState.parametrosNFSe.usuario,
      senha: formState.parametrosNFSe.senha,
      certificado: formState.parametrosNFSe.certificado || '',
      senhaCertificado: formState.parametrosNFSe.senhaCertificado || '',
      idCertificadoCredenciado: formState.parametrosNFSe.idCertificadoCredenciado,
      proxyRede: '',
      proxyUsuario: '',
      proxySenha: '',
      proxyDominio: '',
      aceitaISSZerado: formState.parametrosNFSe.aceitaIssZerado,
      exibeVencimento: formState.parametrosNFSe.exibeVencimento,
      usaLeiTransparenciaFiscal: formState.parametrosNFSe.usaLeiTransparenciaFiscal,
      usaEnvioEmail: formState.parametrosNFSe.usaEnvioEmail,
      dataAdesaoSimples: defaultDate,
      aliqIssSimples: toNumber(formState.parametrosNFSe.aliqIssSimples),
      urlProducao: formState.parametrosNFSe.urlProducao,
      urlHomologacao: formState.parametrosNFSe.urlHomologacao,
      aedfChaveAcesso: '',
      prefeituraAcataEnderecoXml: false,
      tipoRecolhimentoIss: formState.parametrosNFSe.tipoRecolhimentoIss,
      UsaPadraoNfseNacional: formState.parametrosNFSe.usaPadraoNfseNacional,
      RemoverInscricaoMunicipal: formState.parametrosNFSe.removerInscricaoMunicipal,
    },
    listaNotaFiscalServico: [
      {
        codigo: 0,
        numeroRps: toNumber(formState.notaFiscal.numeroRps),
        serieRps,
        subTotal: toNumber(formState.notaFiscal.subTotal),
        textoNF: formState.notaFiscal.textoNF,
        tipSerCodigo: toNumber(formState.notaFiscal.tipSerCodigo),
        endereco: {
          logradouro: formState.notaFiscal.tomador.endereco.logradouro,
          complemento: formState.notaFiscal.tomador.endereco.complemento,
          numero: formState.notaFiscal.tomador.endereco.numero,
          bairro: formState.notaFiscal.tomador.endereco.bairro,
          cidade: formState.notaFiscal.tomador.endereco.cidade,
          estado: formState.notaFiscal.tomador.endereco.estado,
          cep: toDigits(formState.notaFiscal.tomador.endereco.cep),
          ibge: formState.notaFiscal.tomador.endereco.ibge,
        },
        dataEmissao: toIsoOrDefault(formState.notaFiscal.dataEmissao, defaultDate),
        status: formState.notaFiscal.status,
        cnpjCpf: toDigits(formState.notaFiscal.tomador.cnpjCpf),
        inscricaoEstadual: formState.notaFiscal.tomador.inscricaoEstadual,
        inscricaoMunicipal: formState.notaFiscal.tomador.inscricaoMunicipal,
        fone: formState.notaFiscal.tomador.telefone,
        nomeRazao: formState.notaFiscal.tomador.nomeRazao,
        fantasia: formState.notaFiscal.tomador.fantasia,
        observacoes: '',
        descontos,
        deducoes,
        valorBruto,
        motivoCancelamento: formState.notaFiscal.motivoCancelamento || '',
        dataCancelamento: toIsoOrDefault(formState.notaFiscal.dataCancelamento, defaultDate),
        valorCOFINS: toNumber(tributos.cofins.valor),
        valorCSLL: toNumber(tributos.csll.valor),
        valorINSS: toNumber(tributos.inss.valor),
        valorIRRF: toNumber(tributos.irrf.valor),
        valorISSQN: toNumber(tributos.issqn.valor),
        valorPIS: toNumber(tributos.pis.valor),
        enderecoPrestacaoServico: {
          logradouro: formState.notaFiscal.enderecoPrestacaoServico.logradouro,
          complemento: formState.notaFiscal.enderecoPrestacaoServico.complemento,
          numero: formState.notaFiscal.enderecoPrestacaoServico.numero,
          bairro: formState.notaFiscal.enderecoPrestacaoServico.bairro,
          cidade: formState.notaFiscal.enderecoPrestacaoServico.cidade,
          estado: formState.notaFiscal.enderecoPrestacaoServico.estado,
          cep: toDigits(formState.notaFiscal.enderecoPrestacaoServico.cep),
          ibge: formState.notaFiscal.enderecoPrestacaoServico.ibge,
        },
        naturezaOperacao: formState.notaFiscal.naturezaOperacao,
        atividade: formState.notaFiscal.atividade,
        nbs: formState.notaFiscal.nbs,
        cnae: formState.notaFiscal.cnae,
        emailEnvioNFSe: formState.notaFiscal.emailEnvioNFSe,
        textoLeiTransparenciaPadrao: '',
        textoVencimentoPadrao: '',
        numeroRpsAEDF: 0,
        codigoAEDF: '',
        codigoObra: formState.notaFiscal.codigoObra || '',
        art: formState.notaFiscal.art || '',
        ramoAtividadeTomador: '',
        ibgeMunicipioIncidencia: formState.notaFiscal.ibgeMunicipioIncidencia,
        listaNotaFiscalServicoItens: [
          {
            descricao: formState.notaFiscal.item.descricao,
            quantidade: itemQuantidade,
            valor: itemValor,
            tipSerCodigo: toNumber(formState.notaFiscal.tipSerCodigo),
            baseISSQN,
            percISSQN: toNumber(tributos.issqn.percentual),
            valorISSQN: toNumber(tributos.issqn.valor),
            baseINSS,
            percINSS: toNumber(tributos.inss.percentual),
            valorINSS: toNumber(tributos.inss.valor),
            baseIRPF,
            percIRPF: toNumber(tributos.irrf.percentual),
            valorIRPF: toNumber(tributos.irrf.valor),
            basePIS,
            percPIS: toNumber(tributos.pis.percentual),
            valorPIS: toNumber(tributos.pis.valor),
            baseCOFINS,
            percCOFINS: toNumber(tributos.cofins.percentual),
            valorCOFINS: toNumber(tributos.cofins.valor),
            baseCSLL,
            percCSLL: toNumber(tributos.csll.percentual),
            valorCSLL: toNumber(tributos.csll.valor),
            deduzISSQN: flags.deduzIssqn,
            deduzIRPF: flags.deduzIrpf,
            deduzINSS: flags.deduzInss,
            deduzPIS: flags.deduzPis,
            deduzCOFINS: flags.deduzCofins,
            deduzCSLL: flags.deduzCsll,
            ocultarValorISSQN: flags.ocultarValorIssqn,
            ocultarAliquotaISSQN: flags.ocultarAliquotaIssqn,
          },
        ],
        listaContasReceber: [],
        listaServicoMensal: [],
      },
    ],
  }
}
