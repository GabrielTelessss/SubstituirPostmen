# Substituir Postman — Emissor NFS-e (UI)

Aplicação web (React + Vite + SCSS) para montar, importar/exportar e enviar payloads de NFS-e, substituindo o fluxo de testes via Postman. O foco é facilitar preenchimento, cálculo e inspeção de resposta (JSON e XML) com uma interface única.

## O que o sistema faz

- Monta o payload JSON no formato esperado pela API de NFS-e.
- Formulário com seções colapsáveis:
  - Configuração da requisição (URL, Authorization, ambiente).
  - Lote RPS (número do lote e campos de retorno do lote).
  - Prestador de serviço.
  - Parâmetros NFS-e (usuário/senha, certificado por arquivo, URLs, flags).
  - Nota Fiscal (tomador, endereço de prestação, tributos, flags, item, cancelamento, obra/ART).
- Cálculos automáticos:
  - SubTotal calculado e ajustado conforme deduções/descontos e tributos marcados como “Deduz”.
  - Valores de tributos calculados por base e percentual.
- Máscaras para campos comuns (CNPJ/CPF, CEP, telefone).
- Exporta o payload para arquivo JSON e importa JSON para preencher o formulário (merge).
- Envia requisição (POST) e mostra resposta:
  - Status do envio/lote, duração (ms), lista de erros.
  - JSON bruto copiável.
  - XML enviado e XML de resposta com decode/indent e botão de copiar.

## Limitações importantes

- Certificado do Windows (Opções da Internet → Conteúdo → Certificados):
  - Navegadores não permitem listar/escolher certificados do repositório do Windows via JavaScript.
  - Se a integração exigir certificado de cliente (mTLS), a seleção acontece no próprio navegador/Windows durante a conexão HTTPS.
  - Para “escolher pelo sistema” dentro da UI, é necessário um back-end/app nativo (ex.: API C# local, Electron, etc.).
- CORS:
  - Se a API não liberar CORS, chamadas diretas do navegador podem falhar com “Network Error”.
  - Solução recomendada: usar um back-end intermediário (ex.: API C#) ou configurar CORS no servidor.

## Requisitos

- Node.js (recomendado: LTS)
- npm

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Como usar (fluxo básico)

1. Preencha “Configuração da requisição” (URL e Authorization, se necessário).
2. Preencha as seções de Lote/Prestador/Parâmetros/Nota Fiscal.
3. Use “Ver JSON” para revisar o payload.
4. (Opcional) “Salvar Rascunho” / “Carregar Rascunho”.
5. Clique em “Enviar”.
6. No painel direito, valide status, erros e XML/JSON retornados.

## Segurança

- Evite persistir secrets localmente. O rascunho não persiste Authorization, senha e dados sensíveis do certificado.
- Para uso multiusuário e certificado do Windows, considere integrar com um back-end (C#) e manter credenciais no servidor.

