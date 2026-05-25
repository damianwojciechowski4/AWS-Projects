# Image Agent — Plan implementacji

## Context
Masz już gotowy, dopracowany prototyp UI (6 plików JSX w image-agent/). Prototyp to kompletna aplikacja studyjna do generowania obrazów AI, napisana jako vanilla CDN React. Celem jest przeniesienie jej na proper stack (Vite + TypeScript), podpięcie rzeczywistego backendu (Lambda), hostowanie na AWS serverless, oraz dodanie autentykacji (Cognito) i traceability (DynamoDB).

---

## Architektura

```
User → CloudFront → S3 (React SPA / Vite build)
                         │ API calls (JWT)
                    API Gateway (HTTP API)
                         │
                   [Cognito JWT Authorizer]
                         │
                    Lambda (Python 3.12)
                    ├── OpenRouter API  (FLUX, SDXL, Playground, Recraft)
                    ├── Google Gemini API (Imagen 4, Imagen 4 Fast)
                    ├── S3 images-bucket  (wygenerowane obrazy → presigned URL)
                    └── DynamoDB (projekty + generacje + usage stats)
```

**AWS Services:**
- **S3 `image-agent-frontend`** — hosting React SPA (public static website)
- **S3 `image-agent-images`** — prywatny bucket na wygenerowane obrazy; dostęp przez presigned URL (1h)
- CloudFront — CDN + HTTPS dla frontendu
- Cognito User Pool — auth (1 użytkownik, e-mail/hasło, SRP flow)
- API Gateway (HTTP API) — REST endpoints z Cognito JWT authorizer
- Lambda (Python 3.12) — logika generowania + CRUD projektów
- DynamoDB — dwie tabele: `projects` + `generations`
- SSM Parameter Store — API keys (OpenRouter, Google)
- CloudWatch Logs — logi Lambda

---

## Struktura katalogów

```
image-agent/
├── terraform/
│   ├── backend.tf
│   ├── versions.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── s3.tf           # frontend bucket + images bucket + lifecycle rules
│   ├── cloudfront.tf   # CDN dla frontendu
│   ├── cognito.tf      # User Pool + App Client
│   ├── api_gateway.tf  # HTTP API + Cognito JWT authorizer + routes
│   ├── lambda.tf       # Lambda function (ZIP deploy)
│   ├── dynamodb.tf     # Tabele: projects + generations
│   ├── iam.tf          # Rola Lambda + polityki (least-privilege)
│   └── ssm.tf          # Placeholder SecureString params
├── lambda/
│   └── src/
│       ├── handler.py      # Router: parsuje route+method → wywołuje odpowiedni moduł
│       ├── generate.py     # Logika generowania (pętla agentowa)
│       ├── providers.py    # Klienty: OpenRouter + Gemini
│       ├── projects.py     # CRUD projektów ↔ DynamoDB
│       └── tracker.py      # Logowanie generacji → DynamoDB + S3 upload
├── frontend/               # Migracja prototypu do Vite + TypeScript
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # ← app.jsx (z prototypu)
│       ├── lib/
│       │   ├── auth.ts          # AWS Amplify Cognito (signIn, signOut, getJWT)
│       │   └── api.ts           # Axios instance + JWT interceptor
│       ├── data/
│       │   └── types.ts         # TypeScript typy: Project, Generation, Provider, UsageRun
│       └── components/
│           ├── screens/
│           │   ├── StudioScreen.tsx     # ← screens.jsx: StudioCanvas
│           │   ├── ProjectsScreen.tsx   # ← screens.jsx: ProjectsScreen
│           │   ├── HistoryScreen.tsx    # ← screens.jsx: HistoryScreen
│           │   └── UsageScreen.tsx      # ← screens.jsx: UsageScreen
│           ├── TopBar.tsx               # ← screens.jsx: TopBar
│           ├── LeftRail.tsx             # ← screens.jsx: LeftRail
│           ├── Inspector.tsx            # ← screens.jsx: Inspector
│           ├── PromptDock.tsx           # ← screens.jsx: PromptDock
│           └── ui/
│               ├── ImagePh.tsx          # ← components.jsx (placeholder)
│               ├── Btn.tsx, Seg.tsx, Tag.tsx, FLabel.tsx
│               └── icons.tsx            # ← icons.jsx
└── (app.jsx, components.jsx, data.jsx, screens.jsx, icons.jsx, tweaks-panel.jsx)
    # prototyp pozostaje; frontend/ to jego konwersja
```

---

## Dane — DynamoDB

### Tabela `image-agent-projects`
```
PK: project_id (S)  # np. "p_brand"
Atrybuty: name, sub, accent (N), runs (N), pinned (BOOL),
          style, template, ref_image_key, model_id, ratio, seed_strategy
```

### Tabela `image-agent-generations`
```
PK: gen_id (S)        # UUID
SK: project_id (S)    # umożliwia query po projekcie
GSI: timestamp-index  # query po dacie dla UsageScreen
Atrybuty: timestamp, prompt, model_id, provider, ratio, seed,
          s3_image_key, cost_usd, latency_ms, status, error_msg
```
**Uwaga**: dla image generation nie ma "input_tokens" — modele płacą per-image. `cost_usd` liczymy z cennika w Lambda (`PRICING_TABLE` dict: model_id → cost).

---

## Backend Lambda

### `handler.py` — router
```python
def lambda_handler(event, context):
    route = event['routeKey']  # np. "POST /generate"
    if route == "POST /generate":   return generate.handle(event)
    if route == "GET /projects":    return projects.list_all()
    if route == "POST /projects":   return projects.create(event)
    if route == "GET /generations": return tracker.list_recent(event)
    if route == "GET /usage":       return tracker.get_stats(event)
```

### `generate.py` — pętla agentowa
```
1. Parsuj body: project_id, prompt, model_id, ratio, seed, count (1-4)
2. Pobierz projekt z DynamoDB (style template)
3. Zbuduj final_prompt = project.template.format(subject=prompt) OR prompt (jeśli brak template)
4. Pobierz API key z SSM (cache module-level)
5. Wywołaj providers.generate(provider, model_id, final_prompt, ratio, seed, count)
6. Dla każdego obrazu: upload do S3 (key: generations/{gen_id}.png)
7. tracker.log_generation(gen_id, ...) → DynamoDB
8. Generuj presigned URLs (3600s)
9. Zwróć: { generations: [{gen_id, presigned_url, cost_usd, seed, latency_ms}] }
```

### `providers.py`
- `OpenRouterClient`: POST `https://openrouter.ai/api/v1/images/generations`
  - Modele: flux-1.1-pro, flux-schnell, sdxl-lightning, playground-v3, recraft-v3
  - Odpowiedź: `data[].url` lub `data[].b64_json`
- `GeminiClient`: POST `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - Modele: imagen-4, imagen-4-fast
  - Odpowiedź: `candidates[].content.parts[].inlineData.data` (base64 PNG)
- Oba zwracają: `list[GenerationResult(image_bytes, latency_ms, model_id)]`

### `tracker.py`
- `log_generation()` → `PutItem` do `image-agent-generations`
- `list_recent(project_id)` → `Query` po GSI timestamp-index
- `get_stats(period)` → `Scan` z FilterExpression na timestamp range, agregacja po providerze

---

## Terraform — kluczowe zasoby

### `s3.tf`
```hcl
# Frontend bucket — public static website
resource "aws_s3_bucket" "frontend" { bucket = "image-agent-frontend-${var.account_id}" }
resource "aws_s3_bucket_website_configuration" "frontend" { ... }
resource "aws_s3_bucket_public_access_block" "frontend" { block_public_acls = false, ... }

# Images bucket — prywatny
resource "aws_s3_bucket" "images" { bucket = "image-agent-images-${var.account_id}" }
resource "aws_s3_bucket_public_access_block" "images" { block_public_acls = true, ... }
resource "aws_s3_bucket_lifecycle_configuration" "images" {
  rule { expiration { days = 90 } }  # auto-cleanup
}
```

### `dynamodb.tf`
```hcl
resource "aws_dynamodb_table" "projects" {
  name         = "image-agent-projects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "project_id"
}
resource "aws_dynamodb_table" "generations" {
  name         = "image-agent-generations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gen_id"
  range_key    = "project_id"
  global_secondary_index {
    name      = "timestamp-index"
    hash_key  = "project_id"
    range_key = "timestamp"
  }
}
```

### `cognito.tf`
```hcl
resource "aws_cognito_user_pool" "main" {
  name = "image-agent-pool"
  password_policy { minimum_length = 12 }
  username_attributes = ["email"]
}
resource "aws_cognito_user_pool_client" "app" {
  name         = "image-agent-client"
  user_pool_id = aws_cognito_user_pool.main.id
  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}
```

### `api_gateway.tf` — HTTP API + JWT Authorizer
```hcl
resource "aws_apigatewayv2_api" "main" { name = "image-agent-api"; protocol_type = "HTTP" }
resource "aws_apigatewayv2_authorizer" "cognito" {
  authorizer_type = "JWT"
  jwt_configuration {
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    audience = [aws_cognito_user_pool_client.app.id]
  }
}
# Routes: POST /generate, GET /projects, POST /projects, GET /generations, GET /usage
```

### `lambda.tf` — wzorzec z proj-ec2-scheduler
```hcl
data "archive_file" "lambda" { type="zip"; source_dir="../lambda/src"; output_path="lambda.zip" }
resource "aws_lambda_function" "main" {
  filename     = data.archive_file.lambda.output_path
  runtime      = "python3.12"
  timeout      = 60
  memory_size  = 512
  environment { variables = {
    PROJECTS_TABLE    = aws_dynamodb_table.projects.name
    GENERATIONS_TABLE = aws_dynamodb_table.generations.name
    IMAGES_BUCKET     = aws_s3_bucket.images.bucket
    SSM_OR_KEY        = "/image-agent/openrouter-api-key"
    SSM_GOOGLE_KEY    = "/image-agent/google-api-key"
    REGION            = var.region
  }}
}
```

---

## Frontend — migracja prototypu

**Tech stack**: React 18 + TypeScript + Vite + TailwindCSS

**Strategia migracji**:
1. Scaffold `vite create` z React+TypeScript template
2. Przenieś CSS (wszystkie `const COMP_STYLES` i `const APP_STYLES` z app.jsx) → `src/styles/studio.css`
3. Konwertuj każdy komponent JSX → TSX (dodaj typy do props)
4. Zastąp `window.PROVIDERS / PROJECTS / HIST` → import z `lib/api.ts` (real API calls)
5. Zastąp mock `handleGenerate` z `setTimeout` → prawdziwy `POST /generate`
6. Dodaj `LoginPage.tsx` opakowujący całą aplikację (Cognito check)

**`lib/auth.ts`** — AWS Amplify:
```ts
import { Amplify, Auth } from 'aws-amplify';
Amplify.configure({ Auth: { userPoolId, userPoolWebClientId, region } });
export const signIn = (email, password) => Auth.signIn(email, password);
export const getJwt = async () => (await Auth.currentSession()).getIdToken().getJwtToken();
```

**`lib/api.ts`** — Axios z JWT:
```ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use(async cfg => {
  cfg.headers.Authorization = `Bearer ${await getJwt()}`;
  return cfg;
});
export const generate = (body) => api.post('/generate', body);
export const listProjects = () => api.get('/projects');
export const getUsage = (period) => api.get(`/usage?period=${period}`);
```

**Config** (`.env.local`):
```
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
VITE_COGNITO_USER_POOL_ID=<from terraform output>
VITE_COGNITO_CLIENT_ID=<from terraform output>
VITE_REGION=eu-central-1
```

---

## IAM (`iam.tf`) — least-privilege

Lambda role permissions:
```
dynamodb:PutItem, GetItem, Query, Scan  → image-agent-projects + image-agent-generations
s3:PutObject, GetObject                 → image-agent-images/*
ssm:GetParameter                        → /image-agent/*
logs:CreateLogGroup, CreateLogStream, PutLogEvents
```

---

## Kolejność implementacji

1. **Terraform core** — backend.tf, versions.tf, variables.tf (wzorzec z vpc-design/envs/dev)
2. **Storage** — s3.tf (oba buckety), dynamodb.tf
3. **Auth** — cognito.tf
4. **IAM** — iam.tf
5. **Lambda** — lambda.tf + kod Python: handler → providers → generate → tracker → projects
6. **API** — api_gateway.tf (routes + authorizer)
7. **CDN** — cloudfront.tf, outputs.tf
8. **Frontend** — migracja prototypu: scaffold Vite → przenieś CSS → konwertuj komponenty → podłącz API
9. **Seed danych** — skrypt Python seed_projects.py (wstaw PROJECTS do DynamoDB)

---

## Weryfikacja end-to-end

1. `cd image-agent/terraform && terraform apply` → sprawdź outputs
2. Uzupełnij SSM: `aws ssm put-parameter --name /image-agent/openrouter-api-key --value <KEY> --type SecureString`
3. Utwórz użytkownika: `aws cognito-idp admin-create-user --user-pool-id <id> --username <email>`
4. Seed projektów: `python seed_projects.py`
5. Frontend: `cd frontend && npm run build && aws s3 sync dist/ s3://<frontend-bucket>/`
6. Otwórz CloudFront URL → zaloguj się → wygeneruj obraz
7. Sprawdź: DynamoDB `aws dynamodb scan --table-name image-agent-generations`
8. Sprawdź: S3 `aws s3 ls s3://image-agent-images/generations/`
9. Otwórz `/usage` w aplikacji — powinna pokazać realne dane

---

## Kluczowe pliki do stworzenia / zmodyfikowania

| Plik | Akcja | Opis |
|------|-------|------|
| `terraform/*.tf` | Nowe | Cała infrastruktura (9 plików) |
| `lambda/src/handler.py` | Nowy | Router |
| `lambda/src/generate.py` | Nowy | Agent loop |
| `lambda/src/providers.py` | Nowy | OpenRouter + Gemini clients |
| `lambda/src/tracker.py` | Nowy | DynamoDB logging |
| `lambda/src/projects.py` | Nowy | CRUD projektów |
| `frontend/` | Nowe | Migracja prototypu → Vite+TypeScript |
| `seed_projects.py` | Nowy | Seed danych z data.jsx do DynamoDB |

## Wzorce reużyte z istniejącego repo

- ZIP deployment Lambda: `proj-ec2-scheduler/infra/lambda.tf` (archive_file → aws_lambda_function)
- DynamoDB PAY_PER_REQUEST: `proj-ec2-scheduler/infra/dynamodb.tf`
- Python handler structure: `cross-account-access/lambda/src/handler.py`
- Least-privilege IAM policies: `proj-ec2-scheduler/infra/lambda.tf`
- Terraform backend/versions: `networking/network-design/vpc-design/envs/dev/`
