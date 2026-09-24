$credInput = "protocol=https`nhost=github.com`n"
$credOutput = $credInput | git credential fill
$tokenLine = $credOutput | Where-Object { $_ -like "password=*" }
$userLine = $credOutput | Where-Object { $_ -like "username=*" }

$token = $tokenLine.Substring(9).Trim()
$username = $userLine.Substring(9).Trim()

if (-not $token) {
    Write-Error "Token nao encontrado no Git Credential Manager."
    exit 1
}

Write-Output "Usuario autenticado no GCM: $username"

$headers = @{
    "Authorization" = "Bearer $token"
    "User-Agent" = "PowerShell-AnfraImoveis"
    "Accept" = "application/vnd.github+json"
}

$repoName = "anfra-imoveis"
$repoBody = @{
    name = $repoName
    description = "Portal Digital Oficial da Anfra Imoveis - Venda e Financiamento em Ibirite, Barreiro e RMBH (CRECI-MG PJ 8373)"
    private = $false
} | ConvertTo-Json

try {
    $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $repoBody -ContentType "application/json; charset=utf-8"
    Write-Output "Repositorio criado no GitHub: $($repo.html_url)"
} catch {
    Write-Output "Repositorio pode ja existir ou resposta: $($_.Exception.Message)"
}

git init -b main
git config user.name "dev-victor16"
git config user.email "victor@antigravity.dev"
git add .
git commit -m "feat: portal digital oficial da Anfra Imoveis (Ibirite - MG / CRECI-MG PJ 8373)"

git remote remove origin 2>$null
git remote add origin "https://${username}:${token}@github.com/${username}/${repoName}.git"
git push -u origin main --force

git remote set-url origin "https://github.com/${username}/${repoName}.git"
git remote -v
Write-Output "Push finalizado com sucesso para https://github.com/${username}/${repoName}"
