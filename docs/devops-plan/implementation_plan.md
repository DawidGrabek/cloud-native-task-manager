# Cloud-Native Task Manager — DevOps Rework Plan (v2 — Cost-Optimized)

## Kontekst i założenia

- **AWS Free Credits** — koszt ograniczony do minimum
- **`terraform destroy` po każdej sesji** — płacimy tylko za godziny pracy (AWS liczy hourly!)
- **Bez domeny** — używamy auto-generowanego DNS ALB (`xxxxx.eu-central-1.elb.amazonaws.com`)
- **Cel: maksymalna wiedza, minimalne koszty**
- **Po zakończeniu:** screenshoty → README → `terraform destroy --auto-approve` 

---

## Pokryte koncepty DevOps

> Tabela pokazuje jakie **konkretne narzędzie / technika** uczy danego konceptu.
> Mając tę listę na README, rekruter widzi od razu zakres wiedzy.

| Koncept DevOps | Narzędzie w projekcie | Faza |
|---|---|---|
| **Infrastructure as Code (IaC)** | Terraform (modules, remote state, workspaces) | 1 |
| **Immutable Infrastructure** | Terraform destroy/apply — infrastruktura jest odtwarzalna, nie łatana | 1 |
| **Least Privilege (IAM)** | IRSA, OIDC Role, scoped IAM policies | 1 |
| **Container Orchestration** | EKS (Kubernetes managed) | 2 |
| **Node Autoscaling** | Karpenter — spot instances, scale-to-zero | 2 |
| **Secret Management** | AWS Secrets Manager + External Secrets Operator | 2 |
| **GitOps** | ArgoCD — Git jako jedyne źródło prawdy o stanie klastra | 3 |
| **Progressive Delivery / Canary** | Argo Rollouts — wdrożenia bez downtime, canary 10→50→100% | 3 |
| **Package Management (k8s)** | Helm — parametryzowane szablony, values per env | 4 |
| **Policy as Code** | Kyverno — admission controller, enforce security standards | 4 |
| **CI/CD Pipeline** | GitHub Actions — test, build, scan, push | 5 |
| **Supply Chain Security** | Trivy image scanning, ECR scan on push | 5 |
| **Metrics (Pillar 1)** | Prometheus + prom-client + Grafana dashboards | 6 |
| **Logs (Pillar 2)** | Loki + Promtail + Grafana Explore | 6 |
| **Traces (Pillar 3)** | OpenTelemetry SDK + Grafana Tempo | 6 |
| **Alerting & On-call** | Alertmanager + PrometheusRule CRDs | 6 |
| **High Availability** | HPA, PDB, topologySpreadConstraints, multi-AZ nodes | 7 |
| **Network Security** | NetworkPolicy — mikrosegmentacja ruchu między podami | 7 |
| **Workload Security** | PodSecurityContext, readOnlyRootFilesystem, runAsNonRoot | 7 |

> [!TIP]
> Trzy filary observability (Metrics + Logs + Traces) razem tworzą pełny obraz systemu.
> Projekt jako jeden z niewielu juniorskich portfolio będzie miał kompletne wszystkie trzy.

---

## Szacunkowy koszt per sesja

AWS liczy **godzinowo** — `terraform destroy` kasuje zasoby i zatrzymuje naliczanie.

| Serwis | Koszt/h | Przy 4h sesji |
|--------|---------|---------------|
| EKS Control Plane | $0.10/h | $0.40 |
| EC2 t3.medium (spot, 2 nody) | $0.013/h × 2 | $0.10 |
| NAT Gateway | $0.045/h | $0.18 |
| ALB | $0.008/h | $0.03 |
| ECR storage (10GB) | $0.001/h | ~$0.01 |
| **RAZEM** | | **~$0.72 / sesja** |

> [!TIP]
> Łączny koszt całego projektu (10 sesji × 4h) ≈ **$7–10 USD** z darmowych kredytów.
> ECR i S3 (Terraform state) można zostawić między sesjami — kosztują grosze.

---

## Kluczowe decyzje (pod Twoje wymagania)

| Decyzja | Wybór | Uzasadnienie |
|---------|-------|--------------|
| **Postgres** | StatefulSet w EKS (Bitnami Helm) | RDS = $0.017/h extra, niepotrzebne; StatefulSet uczy PVC, headless service |
| **Redis** | Pomijamy w k8s | Aplikacja go faktycznie nie używa aktywnie |
| **ArgoCD** | ✅ GitOps CD engine | Zastępuje `helm upgrade` z GitHub Actions; top tool w branży |
| **Domena / DNS** | ALB DNS name (bez Route53) | Brak domeny = brak potrzeby; oszczędza ~$0.50/mies + complexity |
| **TLS / HTTPS** | Pomijamy (brak domeny) | HTTP na ALB wystarczy do nauki; upraszcza setup |
| **cert-manager** | Pomijamy | Bez domeny nie ma sensu |
| **external-dns** | Pomijamy | Bez Route53 nie ma sensu |
| **Karpenter** | ✅ Zostawiamy | Kluczowa technologia AWS; warte nauki |
| **AWS LBC** | ✅ Zostawiamy | Standard dla Ingress na EKS |
| **Grafana** | ✅ Na EKS (przez ALB) | Dostępna przez ALB DNS |

---

## Architektura docelowa (bez domeny / TLS)

```
GitHub → GitHub Actions (CI + CD)
           │
           ├── [CI] Test → Trivy Scan → Build (amd64) → Push to ECR
           │
           └── [Config] Update Git values.yaml ← ArgoCD Image Updater
                                       │
┌──────────────── AWS (eu-central-1) ──────────────────────────────────┐
│                                                                    │
│   Internet → ALB → Ingress (AWS LBC)
           │
           ├── /         → frontend pods (HPA: 2-5)
           ├── /api/*    → backend pods  (HPA: 2-10)
           ├── /grafana  → Grafana
           └── /argocd   → ArgoCD UI                      │
│                                                                    │
│   EKS Cluster                                                      │
│   ├── system nodegroup (t3.medium, on-demand, min 1)              │
│   └── app nodegroup   (t3.medium, spot, 0-5 — Karpenter)         │
│                                                                    │
│   [taskmanager namespace]                                          │
│   backend + frontend + postgres StatefulSet                        │
│   ExternalSecret → Secrets Manager (JWT, DB pass)                 │
│                                                                    │
│   [argocd namespace]                                               │
│   ArgoCD + Argo Rollouts + ArgoCD Image Updater                   │
│                                                                    │
│   [monitoring namespace]                                           │
│   Prometheus + Grafana + Alertmanager + Tempo (traces)            │
│   Loki + Promtail                                                 │
│                                                                    │
│   VPC: public subnets (ALB) + private subnets (nodes, DB)         │
│   Single NAT GW (dev — 1 AZ)                                      │
│   ECR (backend + frontend repos)                                   │
│   S3 (Terraform state + Loki storage — zostaje między sesjami)   │
│   Secrets Manager (DB pass, JWT secret)                            │
└────────────────────────────────────────────────────────────────────┘
```

---

## Fazy implementacji

---

## Faza 1 — Terraform: AWS Foundation

### Nowy katalog `terraform/`

```
terraform/
├── modules/
│   ├── vpc/          # VPC, subnety, IGW, NAT GW, route tables
│   ├── eks/          # Klaster EKS + node groups + addons
│   ├── ecr/          # ECR repos x2 (backend, frontend)
│   ├── iam/          # Role: EKS, nodes, GitHub OIDC, IRSA
│   └── secrets/      # Secrets Manager entries
├── environments/
│   └── dev/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── outputs.tf
├── backend.tf        # S3 + DynamoDB state
├── variables.tf
└── outputs.tf
```

#### `terraform/modules/vpc/`
- VPC `10.0.0.0/16`, region `eu-central-1`
- 2 × public subnets (ALB) — 2 AZ
- 2 × private subnets (EKS nodes) — 2 AZ
- 1 × NAT Gateway (single, dev — tańsze)
- Tagi wymagane przez AWS LBC i Karpenter

#### `terraform/modules/eks/`
- EKS `1.30`
- **Managed node group `system`**: 1 × t3.medium, on-demand (Karpenter controller, coredns, etc.)
- **Karpenter NodePool `app`**: spot t3.medium/t3.large, 0→5 nodów (skaluje z 0!)
- OIDC provider dla IRSA
- EKS addons: `vpc-cni`, `coredns`, `kube-proxy`, `aws-ebs-csi-driver`

#### `terraform/modules/iam/`
- EKS Cluster Role + Node Role
- **GitHub Actions OIDC Role** — kluczowe! Trust policy: tylko repo `DawidGrabek/cloud-native-task-manager`
  - Permissions: `ecr:*`, `eks:DescribeCluster`, `secretsmanager:GetSecretValue`
- Karpenter Controller Role (IRSA) — `ec2:*`, `iam:PassRole`
- AWS LBC Role (IRSA) — `elasticloadbalancing:*`, `ec2:Describe*`
- External Secrets Role (IRSA) — `secretsmanager:GetSecretValue`

#### `terraform/modules/ecr/`
- Repos: `taskmanager/backend` i `taskmanager/frontend`
- Lifecycle: keep last 10 images (oszczędność storage)
- Image scanning on push: enabled (darmowe)

#### `terraform/modules/secrets/`
- `taskmanager/dev/db-password` — random generated
- `taskmanager/dev/jwt-secret` — random generated

#### `terraform/backend.tf`
- S3 bucket `taskmanager-tfstate-<random>` (versioning on)
- DynamoDB `taskmanager-tfstate-lock`
- **S3 i DynamoDB zostawiamy między sesjami** — tani (~$0.01/mies), przechowuje stan

---

## Faza 2 — EKS Add-ons (Terraform Helm Provider)

Instalowane przez Terraform, nie ręcznie (`helm install`):

#### `terraform/modules/eks-addons/`

**Karpenter** (`karpenter/karpenter`)
- NodePool `default`: spot t3.medium/t3.large, max 5 nodów
- EC2NodeClass: auto AMI discovery (Bottlerocket lub AL2)
- Skaluje z **0 nodów** — bez ruchu = brak kosztów za nody aplikacyjne!

**AWS Load Balancer Controller** (`eks/aws-load-balancer-controller`)
- Zarządza ALB z poziomu Ingress annotations
- Zastępuje stary `nginx-ingress`

**ArgoCD** (`argo/argo-cd`)
- Instalowany przez Terraform Helm provider w namespace `argocd`
- UI dostępne przez ALB: `http://<alb-dns>/argocd`
- `Application` CRD pointing do `helm/taskmanager/` w repo
- Sync policy: `automated` z `selfHeal: true` i `prune: true`
- RBAC: read-only dla developerów, sync tylko przez CD pipeline

**ArgoCD Image Updater** (`argo/argocd-image-updater`)
- Monitoruje ECR — gdy pojawi się nowy obraz, automatycznie aktualizuje
  wartość `image.tag` w `values-dev.yaml` i robi commit do repo
- Dzięki temu GitHub Actions tylko **buduje i pushuje** — ArgoCD samo deployuje!
- Annotation na ArgoCD Application: `argocd-image-updater.argoproj.io/image-list`

**External Secrets Operator** (`external-secrets/kubernetes-external-secrets`)
- Synchronizuje AWS Secrets Manager → k8s Secrets
- Eliminuje hardcoded secrets

---

## Faza 3 — Helm Chart Aplikacji

#### Nowy katalog `helm/taskmanager/`

```
helm/taskmanager/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
└── templates/
    ├── backend/
    │   ├── deployment.yaml      # resources, probes, securityContext
    │   ├── service.yaml
    │   ├── hpa.yaml             # min 2, max 10, CPU 70%
    │   └── pdb.yaml             # minAvailable: 1
    ├── frontend/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── hpa.yaml             # min 2, max 5, CPU 80%
    │   └── pdb.yaml
    ├── postgres/
    │   ├── statefulset.yaml     # Postgres 15, single replica
    │   ├── service.yaml         # headless service
    │   └── pvc.yaml
    ├── ingress.yaml             # AWS LBC annotations
    ├── external-secret.yaml     # ESO → Secrets Manager
    └── network-policy.yaml      # backend ← tylko frontend + Prometheus
```

**Kluczowe elementy:**
- `ExternalSecret` zamiast `kind: Secret` z hardcoded danymi
- PodSecurityContext: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`
- `topologySpreadConstraints`: pody HA cross-AZ
- Postgres jako StatefulSet z PVC (EBS gp3) — trwałe dane

#### [NEW] `helm/taskmanager/templates/backend/rollout.yaml` — Argo Rollouts
- Zamiast `kind: Deployment` używamy `kind: Rollout` z Argo Rollouts
- Strategia: **Canary** — każdy deploy idzie etapami: 10% → pause → 50% → pause → 100%
- Automatyczny rollback jeśli `AnalysisRun` wykryje wzrost błędów (5xx)
- Widoczne w ArgoCD UI jako animacja canary

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: backend
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: {duration: 2m}
        - setWeight: 50
        - pause: {duration: 2m}
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate   # sprawdza % 5xx błędów
        startingStep: 1
```

#### [NEW] `helm/taskmanager/templates/kyverno-policies.yaml` — Policy as Code
- `ClusterPolicy` wymuszające standardy bezpieczeństwa na **każdym** nowym zasobie
- Reguły:
  - `require-non-root`: każdy kontener musi mieć `runAsNonRoot: true`
  - `disallow-latest-tag`: zakaz używania tagu `latest` w images
  - `require-resource-limits`: każdy kontener musi mieć `resources.limits`
  - `restrict-host-namespaces`: zakaz `hostPID`, `hostNetwork` (poza node-exporter)
- **Koncept:** admission controller — blokuje deploy jeśli narusza politykę

---

## Faza 4 — Observability (Trzy Filary)

> Metrics + Logs + Traces = kompletny obraz systemu. Większość projektów ma tylko 1-2.

#### Filar 1 — Metrics: kube-prometheus-stack (Helm)
- Prometheus + Grafana + Alertmanager + node-exporter + kube-state-metrics
- Grafana dostępna przez ALB: `http://<alb-dns>/grafana`
- Grafana PVC: 5GB EBS (persystentne)
- Dashboardy jako ConfigMap (provisioned):
  - Kubernetes Cluster Overview
  - NodeJS Application (HTTP rate, latency, heap, event loop lag)
  - Argo Rollouts progress dashboard

#### Filar 2 — Logs: Loki Stack (Helm)
- **Loki**: storage → **S3** (tani, trwały między sesjami, nie EBS!)
- **Promtail**: DaemonSet, zbiera logi ze wszystkich podów
- Grafana Explore: korelacja logów z metrykami po czasie

#### Filar 3 — Traces: OpenTelemetry + Grafana Tempo

> Tracing = śledzenie requestu przez wiele serwisów, np. frontend → backend → postgres.
> Odpowiada na pytanie: *gdzie DOKŁADNIE spędził czas ten request?*

**OpenTelemetry SDK w backendzie** (dodajemy do `backend/src/`):
```typescript
// backend/src/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
// Automatycznie instrumentuje: Express, pg, HTTP
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT  // → Tempo
  })
})
```

**OpenTelemetry Collector** (Helm, jako DaemonSet):
- Zbiera traces z backendów → wysyła do Tempo
- Zbiera metryki z podów → wysyła do Prometheus
- Jeden punkt zbierania wszystkich sygnałów

**Grafana Tempo** (Helm):
- Storage: S3 (trwałe, tanie)
- Datasource w Grafanie: korelacja traces ↔ metrics ↔ logs
- TraceQL queries: `{ .http.route = "/api/tasks" && duration > 500ms }`

#### Alerting: PrometheusRule CRDs
- Pod CrashLooping > 3 razy
- HTTP 5xx rate > 5%
- Memory usage > 80%
- Response time p99 > 2s
- Canary rollout error rate > 1% (blokuje automatycznie)

---

## Faza 5 — GitHub Actions + ArgoCD (GitOps CD)

> **GitOps zasada:** Git jest jedynym źródłem prawdy o stanie klastra.
> GitHub Actions tylko **buduje i pushuje** obraz. ArgoCD **deployuje** — sam, automatycznie.

### Flow po zmianie:
```
Developer → git push
     │
     ▼
GitHub Actions [CI]
  test → lint → build → Trivy scan → push ECR
     │
     ▼  (ArgoCD Image Updater wykrywa nowy obraz w ECR)
ArgoCD Image Updater
  → aktualizuje values-dev.yaml (image.tag = $SHA)
  → commit + push do repo
     │
     ▼
ArgoCD wykrywa zmianę w repo
  → sync: helm upgrade w tle
  → health check
  → ✅ Deploy gotowy (widoczny w ArgoCD UI)
```

#### [MODIFY] `.github/workflows/ci.yml` — tylko CI

```yaml
# Trigger: push/PR do dowolnego brancha
jobs:
  commitlint → test → build → trivy-scan → push-to-ecr

  # Po push do ECR, ArgoCD Image Updater przejmuje pałeczkę!
  # Nie ma tu żadnego 'kubectl' ani 'helm upgrade'
```

**Ulepszenia vs stan obecny:**
- ✅ OIDC zamiast `DOCKER_USERNAME/PASSWORD` — bez statycznych kluczy AWS
- ✅ ECR zamiast Docker Hub
- ✅ Trivy image scanning (fail on HIGH/CRITICAL CVE)
- ✅ **GitOps**: GitHub Actions NIE dotyka klastra — ArgoCD deployuje
- ✅ Rollback = `git revert` → ArgoCD automatycznie przywraca poprzedni stan
- ✅ Audit trail: każdy deploy = commit w repo

### ArgoCD Application manifest (`gitops/application.yaml`)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: taskmanager
  namespace: argocd
  annotations:
    argocd-image-updater.argoproj.io/image-list: |
      backend=<account>.dkr.ecr.eu-central-1.amazonaws.com/taskmanager/backend
      frontend=<account>.dkr.ecr.eu-central-1.amazonaws.com/taskmanager/frontend
    argocd-image-updater.argoproj.io/write-back-method: git
spec:
  project: default
  source:
    repoURL: https://github.com/DawidGrabek/cloud-native-task-manager
    path: helm/taskmanager
    helm:
      valueFiles: [values-dev.yaml]
  destination:
    server: https://kubernetes.default.svc
    namespace: taskmanager
  syncPolicy:
    automated:
      selfHeal: true   # klaster = git, zawsze
      prune: true      # usuwa zasoby skasowane w git
    syncOptions:
      - CreateNamespace=true
```

#### Nowy katalog `gitops/`
```
gitops/
├── application.yaml       # ArgoCD Application dla taskmanager
├── monitoring-app.yaml    # ArgoCD Application dla observability stack
└── argocd-projects.yaml   # ArgoCD Projects (RBAC)
```

---

## Faza 6 — Hardening: Kyverno + Security

#### Kyverno (Policy as Code) — instalowany Terraformem

> Kyverno to Kubernetes-native admission controller.
> Działa jak "bramkarz" — każdy `kubectl apply` / `helm install` przechodzi przez niego.
> Jeśli manifest narusza politykę → deploy jest odrzucony z czytelnym błędem.

**Kyverno ClusterPolicies** (w `helm/taskmanager/templates/` lub osobny chart):
```yaml
# Przykład: zakaz obrazów bez explicit tagu
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce   # Audit (log) lub Enforce (blokuj)
  rules:
    - name: check-image-tag
      match:
        resources: { kinds: [Pod] }
      validate:
        message: "Image tag 'latest' is not allowed"
        pattern:
          spec:
            containers:
              - image: "*:!latest"
```

**Polityki które dodamy:**
- `disallow-latest-tag` — wymusza wersjonowanie obrazów
- `require-resource-limits` — każdy kontener musi mieć CPU/mem limits
- `require-non-root` — bezpieczeństwo: zakaz root w kontenerach
- `restrict-host-namespaces` — zakaz `hostPID`, `hostNetwork`
- `require-pod-probes` — każdy deployment musi mieć liveness probe

#### NetworkPolicy — mikrosegmentacja
- Backend akceptuje ruch tylko z: frontend podów i Prometheus (scraping)
- Frontend akceptuje ruch tylko z: ALB
- Postgres akceptuje ruch tylko z: backend podów
- Default deny: wszystko blokowane jeśli brak jawnej reguły

---

## Faza 7 — Workflow sesji i teardown

#### Skrypt `scripts/tf-up.sh` (start sesji)
```bash
#!/bin/bash
cd terraform/environments/dev
terraform init
terraform apply -auto-approve
aws eks update-kubeconfig --name taskmanager-dev --region eu-central-1
echo "✅ Infra ready! ALB: $(terraform output alb_dns_name)"
```

#### Skrypt `scripts/tf-down.sh` (koniec sesji)
```bash
#!/bin/bash
# Usuwa WSZYSTKO (nie usuwa: S3 state, DynamoDB lock, ECR images)
cd terraform/environments/dev
terraform destroy -auto-approve
echo "✅ Infra destroyed. Credits safe."
```

> [!NOTE]
> ECR images zostają między sesjami (koszt: grosze za storage).
> Terraform state w S3 zostaje (wymagane do `terraform apply` w kolejnej sesji).

---

## Dokumentacja końcowa (screenshoty do README)

Lista rzeczy do sfotografowania przed `terraform destroy`:

- [ ] Architektura w draw.io / Excalidraw
- [ ] Grafana — Kubernetes Cluster Overview dashboard
- [ ] Grafana — NodeJS Application Metrics dashboard
- [ ] Grafana — Traces w Tempo (Trace Explorer z waterfall view)
- [ ] Grafana — Loki logi ze skorelowanym trace ID
- [ ] Alertmanager — skonfigurowane alerty
- [ ] **ArgoCD UI — lista aplikacji (sync status ✅)**
- [ ] **ArgoCD UI — drzewo zasobów (piękny deployment graph)**
- [ ] **Argo Rollouts UI — canary w trakcie wdrożenia (10%→50%→100%)**
- [ ] GitHub Actions — udany CI pipeline run (build + Trivy scan wyniki)
- [ ] Kyverno — odrzucony deploy z powodu naruszenia polityki (terminal)
- [ ] AWS Console — EKS + Karpenter nodes
- [ ] AWS Console — ECR scan results
- [ ] `kubectl get rollout -n taskmanager` + `kubectl argo rollouts get rollout backend`
- [ ] `kubectl get hpa -n taskmanager`

---

## Kolejność pracy

```
Sesja 1: Terraform — VPC, IAM, ECR, S3 state, remote backend
Sesja 2: Terraform — EKS cluster + addons (AWS LBC, ESO, Karpenter)
Sesja 3: Terraform — ArgoCD + Argo Rollouts + Image Updater + Kyverno
Sesja 4: Helm chart aplikacji + ArgoCD Application + Rollout strategy
Sesja 5: GitHub Actions CI (OIDC, ECR push, Trivy scan)
Sesja 6: Observability — Metrics (prometheus-stack) + Logs (Loki) + Traces (OTel + Tempo)
Sesja 7: Hardening — NetworkPolicy, HPA, PDB, Kyverno policies, security contexts
Sesja 8: End-to-end test, canary demo, screenshoty, README, finalne destroy
```

---

## Open Questions (already answered)

- ✅ AWS + kredyty → koszt ~$0.72/sesja, bezpieczne
- ✅ Postgres → StatefulSet w EKS (Bitnami Helm chart)
- ✅ Brak domeny → ALB DNS name, bez Route53/cert-manager
