# DevOps Rework — Task Tracker

## Sesja 1: Terraform Foundation
- [/] Struktura katalogów `terraform/`
- [ ] `terraform/backend-bootstrap/` — S3 bucket + DynamoDB (one-time setup)
- [ ] `terraform/modules/vpc/` — VPC, subnets, IGW, NAT GW
- [ ] `terraform/modules/iam/` — EKS roles, GitHub OIDC, IRSA roles
- [ ] `terraform/modules/ecr/` — ECR repos x2
- [ ] `terraform/modules/secrets/` — Secrets Manager entries
- [ ] `terraform/environments/dev/` — root module + tfvars
- [ ] `scripts/tf-up.sh` + `scripts/tf-down.sh`
- [ ] `.gitignore` update (terraform state, .terraform/)

## Sesja 2: EKS + Add-ons
- [ ] `terraform/modules/eks/` — klaster, node groups, OIDC, addons
- [ ] `terraform/modules/eks-addons/` — Karpenter, AWS LBC, ESO

## Sesja 3: ArgoCD + Argo Rollouts + Kyverno
- [ ] ArgoCD via Terraform Helm provider
- [ ] Argo Rollouts via Terraform Helm provider
- [ ] ArgoCD Image Updater
- [ ] Kyverno via Terraform Helm provider
- [ ] `gitops/` directory + Application manifests

## Sesja 4: Helm Chart aplikacji
- [ ] `helm/taskmanager/Chart.yaml`
- [ ] Backend: Rollout, Service, HPA, PDB
- [ ] Frontend: Deployment, Service, HPA, PDB
- [ ] Postgres: StatefulSet, headless Service, PVC
- [ ] Ingress (AWS LBC annotations)
- [ ] ExternalSecret
- [ ] NetworkPolicy
- [ ] ArgoCD Application + AnalysisTemplate

## Sesja 5: GitHub Actions CI
- [ ] OIDC setup w GitHub repo secrets
- [ ] Przepisanie ci.yml (tylko CI)
- [ ] ECR push zamiast Docker Hub
- [ ] Trivy scanning step

## Sesja 6: Observability
- [ ] kube-prometheus-stack (Helm via Terraform)
- [ ] Loki Stack (S3 backend)
- [ ] OpenTelemetry Collector
- [ ] Grafana Tempo (S3 backend)
- [ ] OTel SDK w backendzie (`backend/src/telemetry.ts`)
- [ ] PrometheusRule alerty
- [ ] Dashboardy jako ConfigMap

## Sesja 7: Hardening
- [ ] NetworkPolicy dla wszystkich komponentów
- [ ] Kyverno ClusterPolicies (5 polityk)
- [ ] PodSecurityContext na wszystkich deploymentach
- [ ] HPA finalne tuning
- [ ] PDB dla backend + frontend

## Sesja 8: Finalizacja
- [ ] End-to-end test
- [ ] Canary deployment demo
- [ ] Screenshoty (lista w planie)
- [ ] README finalne
- [ ] `terraform destroy` finalne
