como interpretar um documento pdf em formato interno imagem com ia no gpt?

Quando um PDF é “imagem” internamente (ou seja, não tem texto selecionável), ele é basicamente um conjunto de páginas rasterizadas. Para uma IA entender o conteúdo, você precisa fazer OCR (Optical Character Recognition) antes ou durante a leitura.

Existem 3 formas principais de fazer isso usando IA / GPT.

1️⃣ Converter o PDF para imagens + enviar para GPT Vision (mais simples)

Você transforma cada página em imagem e usa um modelo multimodal para interpretar.

Fluxo

Converter PDF → imagens

Enviar cada página para o modelo

Pedir para extrair texto ou estruturar

Exemplo em Node.js
import fs from "fs"
import OpenAI from "openai"

const openai = new OpenAI()

const response = await openai.responses.create({
  model: "gpt-4.1",
  input: [{
    role: "user",
    content: [
      { type: "input_text", text: "Extraia todo o texto desta página:" },
      {
        type: "input_image",
        image_url: "data:image/png;base64,...."
      }
    ]
  }]
})

console.log(response.output_text)
Converter PDF → imagem
brew install poppler
pdftoppm arquivo.pdf page -png

Resultado:

page-1.png
page-2.png
page-3.png

Depois você manda cada página.

✅ Simples
❌ caro se PDF for grande

2️⃣ OCR primeiro (Tesseract / Google Vision / AWS Textract)

Esse é o fluxo profissional.

Pipeline
PDF (imagem)
   ↓
OCR
   ↓
Texto estruturado
   ↓
GPT interpreta / analisa
Exemplo com Tesseract
brew install tesseract
tesseract page-1.png output -l por

Depois você manda o texto para GPT.

3️⃣ Usar OCR com layout (melhor para documentos complexos)

Se o documento tiver:

tabelas

contratos

layout complexo

formulários

Use ferramentas com OCR + estrutura.

Melhores APIs
Serviço	Melhor para
Google Vision OCR	geral
AWS Textract	tabelas e formulários
Azure Form Recognizer	documentos estruturados
PaddleOCR	open source forte

Exemplo Textract retorna:

{
 table: [...],
 cells: [...],
 text: [...]
}

Depois GPT interpreta.

4️⃣ Pipeline ideal (recomendado)

Se você estiver construindo um sistema robusto:

PDF upload
   ↓
Detectar tipo
   ↓
Se tiver texto → parse normal
Se imagem → OCR
   ↓
Gerar JSON estruturado
   ↓
GPT analisa
5️⃣ Detectar se o PDF é imagem

Antes de tudo vale detectar.

Em Python:

import fitz

doc = fitz.open("arquivo.pdf")

page = doc[0]
text = page.get_text()

if len(text) < 10:
    print("PDF é imagem")
6️⃣ Truque avançado (muito usado em IA)

Rodar OCR + Vision juntos.

Exemplo prompt:

Aqui está uma página escaneada.

1. Extraia o texto
2. Preserve layout
3. Identifique tabelas
4. Gere JSON estruturado

Modelos multimodais fazem isso bem.

7️⃣ Ferramentas prontas (muito boas)

Algumas libs que já fazem tudo:

Unstructured.io

LlamaParse

DocTR

LayoutLM

Nougat (Meta)

Exemplo:

LlamaParse → OCR + layout + markdown
🚀 Arquitetura usada em sistemas grandes
PDF
 ↓
LlamaParse / OCR
 ↓
Markdown estruturado
 ↓
Chunking
 ↓
Embeddings
 ↓
RAG
 ↓
GPT

💡 Se quiser, posso também te mostrar:

o pipeline mais avançado do mercado hoje (RAG para PDFs escaneados)

ou como processar 10.000 PDFs escaneados por dia gastando centavos (arquitetura usada em fintechs e legaltechs).

Usando n8n

De preferencia algum node nativo
Pensou por 27s

Dá pra fazer 100% dentro do n8n sim — e com node nativo. O pulo do gato é:

PDF com texto selecionável → Extract From File (ou “Read PDF” em versões antigas)

PDF escaneado (imagem) → precisa de OCR (nativamente, o caminho mais direto é AWS Textract)

Fluxo recomendado (com fallback automático)

Trigger (Webhook / Google Drive / Gmail / Form / etc.)

Extract From File → tenta extrair texto do PDF (rápido e barato)

IF: se o texto vier vazio/curto, assume que é PDF imagem

AWS Textract → OCR do documento

(Opcional) OpenAI / AI node → organizar em JSON, limpar, resumir, extrair campos, etc.

Opção 1: PDF “normal” (texto) — só node nativo

Nodes:

Extract From File (ou Read PDF) → saída: texto
Tem template pronto do próprio n8n pra isso.

Opção 2: PDF escaneado (imagem) — OCR com node nativo (melhor caminho)
Usando AWS Textract (nativo)

O n8n tem node oficial do AWS Textract.

Nodes (modelo simples e robusto):

AWS S3 → Upload do PDF (ou imagem) pra um bucket

AWS Textract → operação tipo Detect/Analyze (dependendo do que você precisa: texto puro vs tabelas/formulários)

Code (ou Item Lists) → juntar os “Blocks/Lines” num texto só

OpenAI / AI Agent → transformar em algo útil (campos, tabela, JSON)

Se seu objetivo envolve tabela e campos, Textract costuma ser bem melhor do que OCR “texto puro”.

Detecção automática (pra não depender de “achar” se é imagem)

No IF, use uma regra tipo:

length(texto_extraido) < 50 → manda pro OCR
Assim você não precisa saber antes.

Alternativa (não-nativa) se você não quiser AWS

Google Vision OCR funciona bem, mas normalmente entra via HTTP Request (apesar de existirem workflows prontos mostrando isso).

Se você me disser de onde vem o PDF (Drive? WhatsApp? Gmail? upload via form?) e se você precisa só texto ou tabela/campos, eu já te passo o desenho exato dos nodes e as expressões do IF.

Quero usar ou open ai ou gemini pra isso que é o que tenho
Pensou por 25s

Dá pra fazer com OpenAI ou Gemini, mas tem um detalhe inevitável no n8n:

Se o PDF é escaneado (imagem), o modelo (OpenAI/Gemini) não “lê PDF imagem” direto como texto. Ele precisa ver imagens (páginas em PNG/JPG) ou você precisa de um OCR dedicado.

Então o fluxo no n8n vira: PDF → imagens por página → IA (vision) → texto/JSON.

Abaixo vão 2 jeitos bons, priorizando nodes nativos.

Opção A (recomendada): n8n self-hosted + node nativo “Execute Command”

Você converte o PDF em imagens localmente (poppler/ImageMagick) e manda as imagens pro OpenAI/Gemini.

1) Converter PDF → PNG por página (Execute Command)

Instale poppler no host do n8n e rode:

pdftoppm -png -r 200 "/tmp/in.pdf" "/tmp/page"
# gera /tmp/page-1.png, /tmp/page-2.png...

Depois, no n8n:

Trigger (Webhook / Drive / etc.) com o PDF em binary

Write Binary File (salva em /tmp/in.pdf)

Execute Command (roda o pdftoppm)

Read Binary Files (lê /tmp/page-*.png e transforma em itens, 1 item por página)

Split in Batches (pra mandar página a página)

Alternativa: usar o node Edit Image (ImageMagick) pra converter PDF→PNG (funciona bem, mas precisa ajustar quando for multipágina).

2) Enviar cada página para OpenAI (vision)

Você pode usar HTTP Request (nativo) apontando pra Responses API e mandando a imagem em base64 data URL (ou URL pública).

Prompt sugerido (por página):

“Extraia TODO o texto desta página preservando quebras de linha. Se houver tabela, devolva em CSV. Se houver campos (nome, CPF, datas), devolva também JSON com chaves claras.”

Depois você Merge as páginas e (opcional) manda um segundo call pro OpenAI só pra normalizar em JSON final.

3) Enviar cada página para Gemini (vision)

Mesma lógica: HTTP Request pro endpoint generateContent, com inlineData base64.

Opção B: só n8n Cloud (sem rodar comando no servidor)

No n8n Cloud, normalmente você não consegue usar conversão local via pdftoppm. Aí você precisa:

ou um conversor externo (API de PDF→imagem),

ou trocar o input (já receber imagens em vez de PDF).

Exemplo de workflow pronto do n8n que converte PDF multipágina em PNG usando um serviço externo (caso você aceite):

Bônus: fallback esperto (quando o PDF tem texto “de verdade”)

Antes de converter, tente extrair texto com node nativo:

Extract From File (PDF)

IF: se text vier curto/vazio → cai pra Opção A (PDF→PNG→IA)

O que eu faria com “só OpenAI ou Gemini”

Se você consegue self-host (ou já é self-host): Opção A é perfeita e barata.
Se você está no Cloud: você vai precisar aceitar um conversor externo ou mudar o upload para imagem.

Se você me falar (1) se seu n8n é cloud ou self-host e (2) como o PDF chega (Webhook? Drive? WhatsApp?), eu te passo o desenho exato dos nodes + expressões (split/merge/base64) já no formato de workflow.