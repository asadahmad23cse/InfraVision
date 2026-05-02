param(
  [string]$RepoId = "Asadahmad123/infra-vision",
  [switch]$Private
)

$ErrorActionPreference = "Stop"

if (-not $env:HF_TOKEN) {
  throw "Set HF_TOKEN first: `$env:HF_TOKEN='hf_...'"
}

hf auth login --token $env:HF_TOKEN --add-to-git-credential

$visibility = if ($Private) { "--private" } else { "--public" }
hf repos create $RepoId --type space --space-sdk docker --exist-ok $visibility

@"
import os
from huggingface_hub import HfApi

repo_id = os.environ["HF_REPO_ID"]
folder_path = os.getcwd()
api = HfApi(token=os.environ["HF_TOKEN"])
api.create_repo(repo_id=repo_id, repo_type="space", space_sdk="docker", exist_ok=True)
api.upload_folder(
    repo_id=repo_id,
    repo_type="space",
    folder_path=folder_path,
    path_in_repo=".",
    commit_message="Deploy InfraVision Next.js Docker Space",
    ignore_patterns=[
        ".env",
        ".env.*",
        ".git/**",
        ".next/**",
        "node_modules/**",
        "*.log",
        "tsconfig.tsbuildinfo",
    ],
)
"@ | ForEach-Object {
  $env:HF_REPO_ID = $RepoId
  $_ | python -
  if ($LASTEXITCODE -ne 0) {
    throw "Hugging Face upload failed."
  }
}

Write-Host "Deployed: https://huggingface.co/spaces/$RepoId"
