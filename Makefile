# ==============================================================================
# 営業日報システム - Makefile
# ==============================================================================

# 環境変数
PROJECT_ID := daily-report-app-482902
REGION := asia-northeast1
SERVICE_NAME := daily-report-app
ARTIFACT_REGISTRY := asia-northeast1-docker.pkg.dev
IMAGE_NAME := $(ARTIFACT_REGISTRY)/$(PROJECT_ID)/$(SERVICE_NAME)/$(SERVICE_NAME)
TAG := $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")

# ==============================================================================
# 開発
# ==============================================================================

.PHONY: dev
dev: ## 開発サーバー起動
	npm run dev

.PHONY: build
build: ## アプリケーションビルド
	npm run build

.PHONY: start
start: ## 本番サーバー起動
	npm run start

.PHONY: lint
lint: ## ESLint実行
	npm run lint

.PHONY: lint-fix
lint-fix: ## ESLint修正
	npm run lint:fix

.PHONY: format
format: ## Prettierフォーマット
	npm run format

.PHONY: type-check
type-check: ## TypeScript型チェック
	npm run type-check

.PHONY: test
test: ## テスト実行（ウォッチモード）
	npm run test

.PHONY: test-run
test-run: ## テスト実行（単発）
	npm run test:run

.PHONY: test-coverage
test-coverage: ## テスト実行（カバレッジ付き）
	npm run test:coverage

# ==============================================================================
# Prisma
# ==============================================================================

.PHONY: prisma-generate
prisma-generate: ## Prisma Client生成
	npx prisma generate

.PHONY: prisma-migrate
prisma-migrate: ## マイグレーション実行
	npx prisma migrate dev

.PHONY: prisma-migrate-prod
prisma-migrate-prod: ## 本番マイグレーション実行
	npx prisma migrate deploy

.PHONY: prisma-studio
prisma-studio: ## Prisma Studio起動
	npx prisma studio

.PHONY: prisma-seed
prisma-seed: ## シードデータ投入
	npx prisma db seed

# ==============================================================================
# Docker
# ==============================================================================

.PHONY: docker-build
docker-build: ## Dockerイメージビルド
	docker build -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest .

.PHONY: docker-run
docker-run: ## Dockerコンテナ起動
	docker run -p 3000:3000 --env-file .env.local $(IMAGE_NAME):latest

.PHONY: docker-push
docker-push: ## Dockerイメージプッシュ
	docker push $(IMAGE_NAME):$(TAG)
	docker push $(IMAGE_NAME):latest

# ==============================================================================
# Google Cloud
# ==============================================================================

.PHONY: gcloud-auth
gcloud-auth: ## GCloud認証
	gcloud auth login
	gcloud config set project $(PROJECT_ID)

.PHONY: gcloud-docker-auth
gcloud-docker-auth: ## GCloud Docker認証
	gcloud auth configure-docker $(ARTIFACT_REGISTRY) --quiet

.PHONY: gcloud-create-repo
gcloud-create-repo: ## Artifact Registryリポジトリ作成
	gcloud artifacts repositories create $(SERVICE_NAME) \
		--repository-format=docker \
		--location=$(REGION) \
		--description="Daily Report App Docker Repository"

# ==============================================================================
# デプロイ
# ==============================================================================

.PHONY: deploy
deploy: docker-build docker-push cloud-run-deploy ## フルデプロイ（ビルド→プッシュ→デプロイ）

.PHONY: cloud-run-deploy
cloud-run-deploy: ## Cloud Runデプロイ
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):$(TAG) \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--port 3000 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 10 \
		--set-env-vars "NODE_ENV=production"

.PHONY: cloud-run-deploy-latest
cloud-run-deploy-latest: ## Cloud Runデプロイ（latestタグ）
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):latest \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--port 3000 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 10 \
		--set-env-vars "NODE_ENV=production"

.PHONY: cloud-run-describe
cloud-run-describe: ## Cloud Runサービス情報表示
	gcloud run services describe $(SERVICE_NAME) --region $(REGION)

.PHONY: cloud-run-logs
cloud-run-logs: ## Cloud Runログ表示
	gcloud run services logs read $(SERVICE_NAME) --region $(REGION) --limit 100

.PHONY: cloud-run-url
cloud-run-url: ## Cloud RunサービスURL表示
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format='value(status.url)'

# ==============================================================================
# セットアップ
# ==============================================================================

.PHONY: setup
setup: ## 初期セットアップ
	npm install
	npx prisma generate
	cp .env.example .env.local || true

.PHONY: setup-gcloud
setup-gcloud: gcloud-auth gcloud-docker-auth gcloud-create-repo ## GCloudセットアップ

# ==============================================================================
# ヘルプ
# ==============================================================================

.PHONY: help
help: ## ヘルプ表示
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
