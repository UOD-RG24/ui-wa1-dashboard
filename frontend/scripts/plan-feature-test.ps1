$ErrorActionPreference = "Continue"
$results = New-Object System.Collections.Generic.List[object]

function Rec([string]$Area, [string]$Feature, [bool]$Pass, [string]$Detail, [string]$Via) {
  $d = (($Detail -replace "\s+", " ").Trim())
  if ($d.Length -gt 260) { $d = $d.Substring(0, 260) }
  $results.Add([pscustomobject]@{ Area=$Area; Feature=$Feature; Pass=$Pass; Via=$Via; Detail=$d }) | Out-Null
  Write-Host ("[{0}] {1} / {2} :: {3}" -f ($(if ($Pass) {"PASS"} else {"FAIL"}), $Area, $Feature, $d))
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [string]$JsonBody = $null,
    [byte[]]$RawBody = $null,
    [string]$ContentType = $null
  )
  $req = [System.Net.HttpWebRequest]::Create($Url)
  $req.Method = $Method
  $req.Timeout = 120000
  $req.ReadWriteTimeout = 120000
  $req.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
  foreach ($k in $Headers.Keys) {
    if ($k -ieq "Authorization") { $req.Headers["Authorization"] = [string]$Headers[$k] }
    else {
      try { $req.Headers.Add($k, [string]$Headers[$k]) } catch { $req.Headers[$k] = [string]$Headers[$k] }
    }
  }
  if ($null -ne $RawBody) {
    $req.ContentType = $ContentType
    $req.ContentLength = $RawBody.Length
    $s = $req.GetRequestStream(); $s.Write($RawBody, 0, $RawBody.Length); $s.Close()
  } elseif ($null -ne $JsonBody) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($JsonBody)
    $req.ContentType = "application/json; charset=utf-8"
    $req.ContentLength = $bytes.Length
    $s = $req.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
  }
  try {
    $resp = $req.GetResponse()
    $status = [int]$resp.StatusCode
    $ms = New-Object IO.MemoryStream
    $resp.GetResponseStream().CopyTo($ms)
    $payload = $ms.ToArray()
    $resp.Close()
    $text = [Text.Encoding]::UTF8.GetString($payload)
    $json = $null
    try { if ($text) { $json = $text | ConvertFrom-Json } } catch {}
    return [pscustomobject]@{ Status=$status; Text=$text; Json=$json; Bytes=$payload.Length }
  } catch [System.Net.WebException] {
    $status = 0; $text = ""; $json = $null; $bytes = 0
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      try {
        $ms = New-Object IO.MemoryStream
        $_.Exception.Response.GetResponseStream().CopyTo($ms)
        $payload = $ms.ToArray()
        $bytes = $payload.Length
        $text = [Text.Encoding]::UTF8.GetString($payload)
        try { if ($text) { $json = $text | ConvertFrom-Json } } catch {}
      } catch {}
    }
    return [pscustomobject]@{ Status=$status; Text=$text; Json=$json; Bytes=$bytes }
  }
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "plan.test.$stamp@example.com"
$password = "TestPass!12345Aa"
$proxy = "http://localhost:3000/api"
$root = "c:\Users\Guilherme Barnes\Documents\VC award codebase\ui-wa1-dashboard"
$azure = ((Get-Content "$root\frontend\.env.local") | Where-Object { $_ -match '^API_UPSTREAM_URL=' }) -replace '^API_UPSTREAM_URL=',''

Write-Host "USER=$email"
Write-Host "PROXY=$proxy"
Write-Host "AZURE=$azure"

Rec "docs" "AUTH.md" (Test-Path "$root\docs\AUTH.md") "present" "repo"
Rec "docs" "INTEGRATION.md" (Test-Path "$root\docs\INTEGRATION.md") "present" "repo"
$readme = Get-Content "$root\README.md" -Raw
Rec "docs" "README links" (($readme -match "AUTH.md") -and ($readme -match "INTEGRATION.md")) "auth+integration linked" "repo"

$login = Invoke-Api GET "http://localhost:3000/login"
Rec "ui" "GET /login" ($login.Status -eq 200) "status $($login.Status)" "proxy"
$home = Invoke-Api GET "http://localhost:3000/"
Rec "ui" "GET /" ($home.Status -eq 200) "status $($home.Status); AuthGate client-side" "proxy"
Rec "ui" "Microsoft SSO disabled" (($login.Text -match "coming soon") -or ($login.Text -match "not enabled")) "login disables Microsoft" "proxy"

$proxyStatus = Invoke-Api GET "$proxy/auth/status"
Rec "proxy" "Next rewrite to Azure" ($proxyStatus.Status -eq 401) "GET /api/auth/status -> $($proxyStatus.Status)" "proxy"

$signup = Invoke-Api POST "$proxy/auth/jwt/signup" -JsonBody (@{ firstName="Plan"; lastName="Tester"; email=$email; password=$password } | ConvertTo-Json -Compress)
Rec "auth" "POST /auth/jwt/signup" ($signup.Status -ge 200 -and $signup.Status -lt 300) "status $($signup.Status) $($signup.Text)" "proxy"

$signin = Invoke-Api POST "$proxy/auth/jwt/signin" -JsonBody (@{ email=$email; password=$password } | ConvertTo-Json -Compress)
$token = $null
if ($signin.Json -and $signin.Json.accessToken) { $token = [string]$signin.Json.accessToken }
Rec "auth" "POST /auth/jwt/signin" (($signin.Status -ge 200 -and $signin.Status -lt 300) -and $token) "status $($signin.Status); tokenLen=$($token.Length)" "proxy"
$auth = @{ Authorization = "Bearer $token" }

$status = Invoke-Api GET "$proxy/auth/status" -Headers $auth
$signedIn = $false; $emailOk = $false; $role = ""
if ($status.Json) {
  $signedIn = [bool]$status.Json.isSignedIn
  if ($status.Json.user) {
    $emailOk = ($status.Json.user.email -eq $email)
    $role = [string]$status.Json.user.role
  }
}
Rec "auth" "GET /auth/status" ($status.Status -eq 200 -and $signedIn) "status $($status.Status); isSignedIn=$signedIn" "proxy"
Rec "profile" "user from status" $emailOk "email match; role=$role" "proxy"

$noAuth = Invoke-Api GET "$proxy/datasets/get/list"
Rec "auth" "JWT required on datasets" ($noAuth.Status -eq 401 -or $noAuth.Status -eq 403) "no token -> $($noAuth.Status)" "proxy"

$listD = Invoke-Api GET "$proxy/datasets/get/list" -Headers $auth
Rec "datasets" "GET /datasets/get/list" ($listD.Status -eq 200) "status $($listD.Status); count=$(@($listD.Json).Count)" "proxy"

$csv = "gene,s1,s2,s3`nG1,1.1,2.2,3.3`nG2,0.1,0.2,0.3`n"
$csvBytes = [Text.Encoding]::UTF8.GetBytes($csv)
$boundary = [guid]::NewGuid().ToString("N")
$datasetName = "PlanTest DS $stamp"
$sb = New-Object Text.StringBuilder
[void]$sb.Append("--$boundary`r`nContent-Disposition: form-data; name=`"Name`"`r`n`r`n$datasetName`r`n")
[void]$sb.Append("--$boundary`r`nContent-Disposition: form-data; name=`"Description`"`r`n`r`nplan test`r`n")
[void]$sb.Append("--$boundary`r`nContent-Disposition: form-data; name=`"OmicsType`"`r`n`r`ntranscriptomics`r`n")
[void]$sb.Append("--$boundary`r`nContent-Disposition: form-data; name=`"File`"; filename=`"plan-test.csv`"`r`nContent-Type: text/csv`r`n`r`n")
$prefix = [Text.Encoding]::UTF8.GetBytes($sb.ToString())
$suffix = [Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
$raw = New-Object byte[] ($prefix.Length + $csvBytes.Length + $suffix.Length)
[Array]::Copy($prefix, 0, $raw, 0, $prefix.Length)
[Array]::Copy($csvBytes, 0, $raw, $prefix.Length, $csvBytes.Length)
[Array]::Copy($suffix, 0, $raw, $prefix.Length + $csvBytes.Length, $suffix.Length)

$createD = Invoke-Api POST "$proxy/datasets/create" -Headers $auth -RawBody $raw -ContentType "multipart/form-data; boundary=$boundary"
$datasetId = $null
if ($createD.Json -and $createD.Json.id) { $datasetId = [string]$createD.Json.id }
Rec "datasets" "POST /datasets/create" (($createD.Status -ge 200 -and $createD.Status -lt 300) -and $datasetId) "status $($createD.Status); id=$datasetId $($createD.Text)" "proxy"

if ($datasetId) {
  $getD = Invoke-Api GET "$proxy/datasets/get/$datasetId" -Headers $auth
  Rec "datasets" "GET /datasets/get/{id}" ($getD.Status -eq 200 -and $getD.Json.id -eq $datasetId) "status $($getD.Status); omics=$($getD.Json.omicsType)" "proxy"

  $newName = "$datasetName renamed"
  $upd = Invoke-Api PUT "$proxy/datasets/update/$datasetId" -Headers $auth -JsonBody (@{ name = $newName } | ConvertTo-Json -Compress)
  Rec "datasets" "PUT /datasets/update/{id}" ($upd.Status -ge 200 -and $upd.Status -lt 300) "status $($upd.Status)" "proxy"
  $getD2 = Invoke-Api GET "$proxy/datasets/get/$datasetId" -Headers $auth
  Rec "datasets" "rename persisted" ($getD2.Json.name -eq $newName) "name=$($getD2.Json.name)" "proxy"

  $dl = Invoke-Api GET "$proxy/datasets/download/$datasetId" -Headers $auth
  Rec "datasets" "GET /datasets/download/{id}" ($dl.Status -eq 200 -and $dl.Bytes -gt 0) "status $($dl.Status); bytes=$($dl.Bytes)" "proxy"
}

$listE = Invoke-Api GET "$proxy/experiments/get/list" -Headers $auth
Rec "experiments" "GET /experiments/get/list" ($listE.Status -eq 200) "status $($listE.Status); count=$(@($listE.Json).Count)" "proxy"

$expName = "PlanTest Exp $stamp"
$createE = Invoke-Api POST "$proxy/experiments/create" -Headers $auth -JsonBody (@{ name = $expName; description = "plan test" } | ConvertTo-Json -Compress)
$expId = $null
if ($createE.Json -and $createE.Json.id) { $expId = [string]$createE.Json.id }
Rec "experiments" "POST /experiments/create" (($createE.Status -ge 200 -and $createE.Status -lt 300) -and $expId) "status $($createE.Status); id=$expId $($createE.Text)" "proxy"

if ($expId) {
  $getE = Invoke-Api GET "$proxy/experiments/get/$expId" -Headers $auth
  $needed = @("preprocessing","multiOmicsIntegration","training","evaluation","digitalTwin")
  $has = $true
  foreach ($s in $needed) { if (-not ($getE.Json.PSObject.Properties.Name -contains $s)) { $has = $false } }
  Rec "experiments" "GET /experiments/get/{id}" ($getE.Status -eq 200 -and $getE.Json.id -eq $expId) "status $($getE.Status); name=$($getE.Json.name)" "proxy"
  Rec "experiments" "workflow sections present" $has ("sections: " + ($needed -join ",")) "proxy"
  $listE2 = Invoke-Api GET "$proxy/experiments/get/list" -Headers $auth
  $found = $false
  foreach ($row in @($listE2.Json)) { if ($row.id -eq $expId) { $found = $true } }
  Rec "experiments" "list includes created" $found "expId in list" "proxy"
}

if ($datasetId) {
  $del = Invoke-Api DELETE "$proxy/datasets/delete/$datasetId" -Headers $auth
  Rec "datasets" "DELETE /datasets/delete/{id}" ($del.Status -ge 200 -and $del.Status -lt 300) "status $($del.Status)" "proxy"
  $listD2 = Invoke-Api GET "$proxy/datasets/get/list" -Headers $auth
  $still = $false
  foreach ($row in @($listD2.Json)) { if ($row.id -eq $datasetId) { $still = $true } }
  Rec "datasets" "deleted gone from list" (-not $still) "removed" "proxy"
}

$signout = Invoke-Api POST "$proxy/auth/signout" -Headers $auth
Rec "auth" "POST /auth/signout" ($signout.Status -ge 200 -and $signout.Status -lt 300) "status $($signout.Status) $($signout.Text)" "proxy"

$azureSignin = Invoke-Api POST "$azure/auth/jwt/signin" -JsonBody (@{ email=$email; password=$password } | ConvertTo-Json -Compress)
Rec "proxy" "Azure direct signin" ($azureSignin.Status -ge 200 -and $azureSignin.Status -lt 300) "status $($azureSignin.Status)" "azure"

$page = Get-Content "$root\frontend\app\page.tsx" -Raw
Rec "ui-code" "createDataset wired" ($page -match "createDataset") "page calls createDataset" "repo"
Rec "ui-code" "createExperiment wired" ($page -match "createExperiment") "page calls createExperiment" "repo"
Rec "ui-code" "dataset ops wired" (($page -match "updateDataset") -and ($page -match "downloadDataset") -and ($page -match "deleteDataset")) "update/download/delete present" "repo"
Rec "ui-code" "workflow mapper wired" ($page -match "mapExperimentWorkflow") "workflow from API sections" "repo"
$expPage = Get-Content "$root\frontend\app\views\ExperimentPage.tsx" -Raw
Rec "ui-code" "ExperimentPage workflowSteps prop" ($expPage -match "workflowSteps") "accepts API workflow" "repo"

Push-Location "$root\frontend"
$tscOut = & npx tsc --noEmit 2>&1 | Out-String
$tscCode = $LASTEXITCODE
Pop-Location
$snip = if ($tscOut.Length -gt 120) { $tscOut.Substring(0,120) } else { $tscOut }
Rec "build" "tsc --noEmit" ($tscCode -eq 0) "exit=$tscCode $snip" "local"

$outPath = Join-Path $env:TEMP "wa1-plan-test-$stamp.json"
$results | ConvertTo-Json -Depth 5 | Set-Content $outPath -Encoding utf8
$pass = @($results | Where-Object Pass).Count
$fail = @($results | Where-Object { -not $_.Pass }).Count
Write-Host ""
Write-Host "RESULTS_JSON=$outPath"
Write-Host "PASS=$pass FAIL=$fail TOTAL=$($results.Count)"
if ($fail -gt 0) {
  Write-Host "FAILURES:"
  $results | Where-Object { -not $_.Pass } | Format-Table -AutoSize | Out-String -Width 220 | Write-Host
}


