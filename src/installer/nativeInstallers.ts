import { InstallConfig } from './types';

function sanitizeFolderName(raw: string): string {
  const cleaned = raw.trim().replace(/[<>:"/\\|?*]/g, '');
  return cleaned || 'CatParadise';
}

function escapePowerShellSingleQuoted(str: string): string {
  return str.replace(/'/g, "''");
}

function escapeBashDoubleQuoted(str: string): string {
  return str.replace(/(["$`\\])/g, '\\$1');
}

export function generateWindowsBatLauncher(): string {
  const lines = [
    '@echo off',
    'chcp 65001 >nul',
    'title 跨界歸零｜貓咪互動樂園 安裝助手',
    'cd /d "%~dp0"',
    'echo 正在開啟「跨界歸零｜貓咪互動樂園」圖形化安裝精靈...',
    'powershell -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%~dp0scripts\\installer_win.ps1"',
    'if errorlevel 1 (',
    '  echo.',
    '  echo [提示] 若圖形化精靈未自動彈出，將改以標準視窗重新啟動...',
    '  powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\\installer_win.ps1"',
    '  pause',
    ')',
    ''
  ];
  return lines.join('\r\n');
}

export function generateWindowsGuiPs1(config: InstallConfig): string {
  const folderName = sanitizeFolderName(config.installFolderName);
  const psFolder = escapePowerShellSingleQuoted(folderName);
  const port = config.port;
  const hasAi = config.includeCameraBg || config.includeFolderBg;
  const defaultCamera = config.includeCameraBg ? '$true' : '$false';
  const defaultFolder = config.includeFolderBg ? '$true' : '$false';
  const defaultShortcut = config.createShortcut ? '$true' : '$false';
  const defaultAutoOpen = config.autoOpenBrowser ? '$true' : '$false';

  const script = `# -*- coding: utf-8 -*-
# 跨界歸零｜貓咪互動樂園 — Windows 原生圖形化安裝精靈 (WinForms)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$SourceRoot = Split-Path -Parent $PSScriptRoot
$AppSourceDir = Join-Path $SourceRoot 'app'
$DefaultFolderName = '${psFolder}'
$DefaultPort = ${port}
$HasAiPayload = ${hasAi ? '$true' : '$false'}

# 色彩主題：毛屋暖陽・手作紙藝庭院
$ColorCanvas = [System.Drawing.Color]::FromArgb(243, 232, 210)
$ColorSurface = [System.Drawing.Color]::FromArgb(251, 245, 230)
$ColorInk = [System.Drawing.Color]::FromArgb(59, 53, 50)
$ColorMuted = [System.Drawing.Color]::FromArgb(99, 88, 80)
$ColorAccent = [System.Drawing.Color]::FromArgb(200, 109, 77)
$ColorSage = [System.Drawing.Color]::FromArgb(90, 125, 90)
$ColorBorder = [System.Drawing.Color]::FromArgb(216, 206, 188)

$FontTitle = New-Object System.Drawing.Font('Microsoft JhengHei UI', 14, [System.Drawing.FontStyle]::Bold)
$FontSub = New-Object System.Drawing.Font('Microsoft JhengHei UI', 9.5, [System.Drawing.FontStyle]::Regular)
$FontBold = New-Object System.Drawing.Font('Microsoft JhengHei UI', 9.5, [System.Drawing.FontStyle]::Bold)
$FontMono = New-Object System.Drawing.Font('Consolas', 9, [System.Drawing.FontStyle]::Regular)

# 主視窗
$Form = New-Object System.Windows.Forms.Form
$Form.Text = '跨界歸零｜貓咪互動樂園 — 安裝精靈'
$Form.Size = New-Object System.Drawing.Size(680, 520)
$Form.StartPosition = 'CenterScreen'
$Form.FormBorderStyle = 'FixedDialog'
$Form.MaximizeBox = $false
$Form.BackColor = $ColorSurface
$Form.ForeColor = $ColorInk

# 頂部標題列
$HeaderPanel = New-Object System.Windows.Forms.Panel
$HeaderPanel.Location = New-Object System.Drawing.Point(0, 0)
$HeaderPanel.Size = New-Object System.Drawing.Size(680, 74)
$HeaderPanel.BackColor = $ColorCanvas
$Form.Controls.Add($HeaderPanel)

$HeaderTitle = New-Object System.Windows.Forms.Label
$HeaderTitle.Location = New-Object System.Drawing.Point(24, 14)
$HeaderTitle.Size = New-Object System.Drawing.Size(620, 28)
$HeaderTitle.Font = $FontTitle
$HeaderTitle.ForeColor = $ColorInk
$HeaderTitle.Text = '歡迎使用「跨界歸零｜貓咪互動樂園」安裝助手'
$HeaderPanel.Controls.Add($HeaderTitle)

$HeaderDesc = New-Object System.Windows.Forms.Label
$HeaderDesc.Location = New-Object System.Drawing.Point(26, 44)
$HeaderDesc.Size = New-Object System.Drawing.Size(620, 20)
$HeaderDesc.Font = $FontSub
$HeaderDesc.ForeColor = $ColorMuted
$HeaderDesc.Text = '步驟 1 / 5 · 依照畫面指引點擊同意與下一步，即可自動完成所有設定'
$HeaderPanel.Controls.Add($HeaderDesc)

$HeaderLine = New-Object System.Windows.Forms.Panel
$HeaderLine.Location = New-Object System.Drawing.Point(0, 74)
$HeaderLine.Size = New-Object System.Drawing.Size(680, 1)
$HeaderLine.BackColor = $ColorBorder
$Form.Controls.Add($HeaderLine)

# 內容容器
$ContentHost = New-Object System.Windows.Forms.Panel
$ContentHost.Location = New-Object System.Drawing.Point(0, 75)
$ContentHost.Size = New-Object System.Drawing.Size(664, 345)
$ContentHost.BackColor = $ColorSurface
$Form.Controls.Add($ContentHost)

# 底部按鈕列
$FooterLine = New-Object System.Windows.Forms.Panel
$FooterLine.Location = New-Object System.Drawing.Point(0, 420)
$FooterLine.Size = New-Object System.Drawing.Size(680, 1)
$FooterLine.BackColor = $ColorBorder
$Form.Controls.Add($FooterLine)

$FooterPanel = New-Object System.Windows.Forms.Panel
$FooterPanel.Location = New-Object System.Drawing.Point(0, 421)
$FooterPanel.Size = New-Object System.Drawing.Size(680, 62)
$FooterPanel.BackColor = $ColorCanvas
$Form.Controls.Add($FooterPanel)

$BtnCancel = New-Object System.Windows.Forms.Button
$BtnCancel.Text = '取消'
$BtnCancel.Font = $FontSub
$BtnCancel.Size = New-Object System.Drawing.Size(88, 34)
$BtnCancel.Location = New-Object System.Drawing.Point(24, 14)
$BtnCancel.FlatStyle = 'Flat'
$BtnCancel.BackColor = $ColorSurface
$BtnCancel.FlatAppearance.BorderColor = $ColorBorder
$FooterPanel.Controls.Add($BtnCancel)

$BtnBack = New-Object System.Windows.Forms.Button
$BtnBack.Text = '< 上一步'
$BtnBack.Font = $FontSub
$BtnBack.Size = New-Object System.Drawing.Size(96, 34)
$BtnBack.Location = New-Object System.Drawing.Point(434, 14)
$BtnBack.FlatStyle = 'Flat'
$BtnBack.BackColor = $ColorSurface
$BtnBack.FlatAppearance.BorderColor = $ColorBorder
$BtnBack.Enabled = $false
$FooterPanel.Controls.Add($BtnBack)

$BtnNext = New-Object System.Windows.Forms.Button
$BtnNext.Text = '下一步 >'
$BtnNext.Font = $FontBold
$BtnNext.Size = New-Object System.Drawing.Size(116, 34)
$BtnNext.Location = New-Object System.Drawing.Point(538, 14)
$BtnNext.FlatStyle = 'Flat'
$BtnNext.BackColor = $ColorAccent
$BtnNext.ForeColor = [System.Drawing.Color]::White
$BtnNext.FlatAppearance.BorderSize = 0
$FooterPanel.Controls.Add($BtnNext)

# ================= 頁面 1：歡迎畫面 =================
$Page1 = New-Object System.Windows.Forms.Panel
$Page1.Dock = 'Fill'
$Page1.BackColor = $ColorSurface

$P1Text = New-Object System.Windows.Forms.Label
$P1Text.Location = New-Object System.Drawing.Point(28, 22)
$P1Text.Size = New-Object System.Drawing.Size(608, 290)
$P1Text.Font = $FontSub
$P1Text.ForeColor = $ColorInk
$P1Text.Text = @"
這個安裝精靈將協助您在 Windows 電腦上自動安裝「跨界歸零｜貓咪互動樂園」完整展覽系統，全程不需要手動輸入任何終端機指令。

安裝精靈將為您自動完成以下作業：

  1. 部署最新版「毛屋暖陽・手作紙藝庭院」互動展覽前端網頁
  2. 設定本機展覽伺服器（http://localhost:${port}）與 cats/manifest.json 自動同步
  3. 檢查 Python 環境並依勾選自動建置獨立虛擬環境與 AI 去背套件
  4. 於桌面自動建立「啟動貓咪互動樂園」一鍵捷徑

請點擊右下角的「下一步 >」開始安裝。
"@
$Page1.Controls.Add($P1Text)

# ================= 頁面 2：授權與權限同意 =================
$Page2 = New-Object System.Windows.Forms.Panel
$Page2.Dock = 'Fill'
$Page2.BackColor = $ColorSurface
$Page2.Visible = $false

$P2Terms = New-Object System.Windows.Forms.TextBox
$P2Terms.Multiline = $true
$P2Terms.ReadOnly = $true
$P2Terms.ScrollBars = 'Vertical'
$P2Terms.Location = New-Object System.Drawing.Point(28, 20)
$P2Terms.Size = New-Object System.Drawing.Size(608, 236)
$P2Terms.BackColor = [System.Drawing.Color]::White
$P2Terms.ForeColor = $ColorInk
$P2Terms.Font = $FontSub
$P2Terms.Text = @"
【跨界歸零｜貓咪互動樂園 — 安裝與本機使用條款】

一、本機檔案與目錄建立
本安裝助手會在您指定的資料夾中建立應用程式檔案、cats/（去背貓咪圖庫）、input_photos/（原始掃描照片）以及預設的 cats/manifest.json 清單檔，不會修改或刪除您電腦中其他無關的個人檔案。

二、本機展覽伺服器說明
啟動樂園時，會在您的電腦本機連接埠（預設 ${port}）開啟離線網頁伺服器（http://localhost:${port}），僅供現場投影機與瀏覽器顯示互動畫面，不會將現場畫作上傳至任何外部伺服器。

三、Python 虛擬環境與套件安裝
若您勾選「攝影機去背」或「資料夾監控去背」模組，安裝精靈將自動檢查 Python 3，並於安裝資料夾內建立獨立的 .venv 虛擬環境以安裝 opencv-python、pillow 與 numpy，確保不影響系統其他軟體。

四、攝影機與桌面捷徑權限
使用攝影機掃描功能時，請允許系統存取您的 USB 或內建鏡頭；若勾選建立捷徑，本精靈將於桌面新增啟動捷徑方便展場工作人員直接雙擊開展。
"@
$Page2.Controls.Add($P2Terms)

$ChkAgree = New-Object System.Windows.Forms.CheckBox
$ChkAgree.Location = New-Object System.Drawing.Point(28, 274)
$ChkAgree.Size = New-Object System.Drawing.Size(600, 30)
$ChkAgree.Font = $FontBold
$ChkAgree.ForeColor = $ColorInk
$ChkAgree.Text = '我已閱讀並同意上述安裝與本機使用條款'
$Page2.Controls.Add($ChkAgree)

# ================= 頁面 3：安裝位置與模組選擇 =================
$Page3 = New-Object System.Windows.Forms.Panel
$Page3.Dock = 'Fill'
$Page3.BackColor = $ColorSurface
$Page3.Visible = $false

$LblPath = New-Object System.Windows.Forms.Label
$LblPath.Location = New-Object System.Drawing.Point(28, 20)
$LblPath.Size = New-Object System.Drawing.Size(600, 22)
$LblPath.Font = $FontBold
$LblPath.Text = '安裝目標資料夾：'
$Page3.Controls.Add($LblPath)

$TxtPath = New-Object System.Windows.Forms.TextBox
$TxtPath.Location = New-Object System.Drawing.Point(28, 46)
$TxtPath.Size = New-Object System.Drawing.Size(506, 28)
$TxtPath.Font = $FontSub
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$TxtPath.Text = Join-Path $DesktopPath $DefaultFolderName
$Page3.Controls.Add($TxtPath)

$BtnBrowse = New-Object System.Windows.Forms.Button
$BtnBrowse.Text = '瀏覽...'
$BtnBrowse.Font = $FontSub
$BtnBrowse.Location = New-Object System.Drawing.Point(542, 44)
$BtnBrowse.Size = New-Object System.Drawing.Size(94, 29)
$BtnBrowse.FlatStyle = 'Flat'
$BtnBrowse.BackColor = $ColorCanvas
$BtnBrowse.FlatAppearance.BorderColor = $ColorBorder
$BtnBrowse.Add_Click({
  $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
  $dlg.Description = '請選擇要安裝「跨界歸零｜貓咪互動樂園」的資料夾'
  if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $TxtPath.Text = Join-Path $dlg.SelectedPath $DefaultFolderName
  }
})
$Page3.Controls.Add($BtnBrowse)

$LblMod = New-Object System.Windows.Forms.Label
$LblMod.Location = New-Object System.Drawing.Point(28, 92)
$LblMod.Size = New-Object System.Drawing.Size(600, 22)
$LblMod.Font = $FontBold
$LblMod.Text = '選擇要安裝的功能模組：'
$Page3.Controls.Add($LblMod)

$ChkCore = New-Object System.Windows.Forms.CheckBox
$ChkCore.Location = New-Object System.Drawing.Point(34, 120)
$ChkCore.Size = New-Object System.Drawing.Size(590, 26)
$ChkCore.Font = $FontSub
$ChkCore.Checked = $true
$ChkCore.Enabled = $false
$ChkCore.Text = '[必選] 最新版互動前端網頁 + 本機展覽伺服器（Port ' + $DefaultPort + '）與清單自動同步'
$Page3.Controls.Add($ChkCore)

$ChkCamera = New-Object System.Windows.Forms.CheckBox
$ChkCamera.Location = New-Object System.Drawing.Point(34, 152)
$ChkCamera.Size = New-Object System.Drawing.Size(590, 26)
$ChkCamera.Font = $FontSub
$ChkCamera.Checked = ${defaultCamera}
$ChkCamera.Enabled = $HasAiPayload
$ChkCamera.Text = '[選配] 攝影機即時拍照自動去背系統（camera_remove_bg.py，需安裝 Python 影像套件）'
$Page3.Controls.Add($ChkCamera)

$ChkFolderBg = New-Object System.Windows.Forms.CheckBox
$ChkFolderBg.Location = New-Object System.Drawing.Point(34, 184)
$ChkFolderBg.Size = New-Object System.Drawing.Size(590, 26)
$ChkFolderBg.Font = $FontSub
$ChkFolderBg.Checked = ${defaultFolder}
$ChkFolderBg.Enabled = $HasAiPayload
$ChkFolderBg.Text = '[選配] 資料夾監控自動去背系統（folder_remove_bg.py，自動去背 input_photos/ 照片）'
$Page3.Controls.Add($ChkFolderBg)

$ChkShortcut = New-Object System.Windows.Forms.CheckBox
$ChkShortcut.Location = New-Object System.Drawing.Point(34, 216)
$ChkShortcut.Size = New-Object System.Drawing.Size(590, 26)
$ChkShortcut.Font = $FontSub
$ChkShortcut.Checked = ${defaultShortcut}
$ChkShortcut.Text = '[建議] 在桌面建立「啟動貓咪互動樂園」一鍵捷徑'
$Page3.Controls.Add($ChkShortcut)

$LblHint3 = New-Object System.Windows.Forms.Label
$LblHint3.Location = New-Object System.Drawing.Point(34, 262)
$LblHint3.Size = New-Object System.Drawing.Size(590, 44)
$LblHint3.Font = $FontSub
$LblHint3.ForeColor = $ColorMuted
$LblHint3.Text = '提示：若未勾選去背套件，安裝過程約 5 秒即可完成；若勾選去背套件，首次安裝需要網路下載 OpenCV 與 Pillow（約 1～2 分鐘），安裝完成後展覽現場即可完全離線執行。'
$Page3.Controls.Add($LblHint3)

# ================= 頁面 4：自動安裝進度 =================
$Page4 = New-Object System.Windows.Forms.Panel
$Page4.Dock = 'Fill'
$Page4.BackColor = $ColorSurface
$Page4.Visible = $false

$LblProgressStatus = New-Object System.Windows.Forms.Label
$LblProgressStatus.Location = New-Object System.Drawing.Point(28, 22)
$LblProgressStatus.Size = New-Object System.Drawing.Size(608, 24)
$LblProgressStatus.Font = $FontBold
$LblProgressStatus.Text = '準備開始安裝...'
$Page4.Controls.Add($LblProgressStatus)

$ProgressBar = New-Object System.Windows.Forms.ProgressBar
$ProgressBar.Location = New-Object System.Drawing.Point(28, 52)
$ProgressBar.Size = New-Object System.Drawing.Size(608, 24)
$ProgressBar.Minimum = 0
$ProgressBar.Maximum = 100
$ProgressBar.Style = 'Continuous'
$Page4.Controls.Add($ProgressBar)

$TxtLog = New-Object System.Windows.Forms.TextBox
$TxtLog.Multiline = $true
$TxtLog.ReadOnly = $true
$TxtLog.ScrollBars = 'Vertical'
$TxtLog.Location = New-Object System.Drawing.Point(28, 88)
$TxtLog.Size = New-Object System.Drawing.Size(608, 232)
$TxtLog.BackColor = [System.Drawing.Color]::White
$TxtLog.ForeColor = $ColorInk
$TxtLog.Font = $FontMono
$Page4.Controls.Add($TxtLog)

# ================= 頁面 5：安裝完成 =================
$Page5 = New-Object System.Windows.Forms.Panel
$Page5.Dock = 'Fill'
$Page5.BackColor = $ColorSurface
$Page5.Visible = $false

$LblDoneTitle = New-Object System.Windows.Forms.Label
$LblDoneTitle.Location = New-Object System.Drawing.Point(28, 26)
$LblDoneTitle.Size = New-Object System.Drawing.Size(608, 30)
$LblDoneTitle.Font = $FontTitle
$LblDoneTitle.ForeColor = $ColorSage
$LblDoneTitle.Text = '安裝已成功完成！'
$Page5.Controls.Add($LblDoneTitle)

$LblDoneBody = New-Object System.Windows.Forms.Label
$LblDoneBody.Location = New-Object System.Drawing.Point(28, 66)
$LblDoneBody.Size = New-Object System.Drawing.Size(608, 160)
$LblDoneBody.Font = $FontSub
$LblDoneBody.ForeColor = $ColorInk
$Page5.Controls.Add($LblDoneBody)

$ChkLaunchNow = New-Object System.Windows.Forms.CheckBox
$ChkLaunchNow.Location = New-Object System.Drawing.Point(28, 240)
$ChkLaunchNow.Size = New-Object System.Drawing.Size(580, 28)
$ChkLaunchNow.Font = $FontBold
$ChkLaunchNow.Checked = ${defaultAutoOpen}
$ChkLaunchNow.Text = '按「完成」後立即啟動貓咪互動樂園並開啟瀏覽器'
$Page5.Controls.Add($ChkLaunchNow)

$ChkOpenFolder = New-Object System.Windows.Forms.CheckBox
$ChkOpenFolder.Location = New-Object System.Drawing.Point(28, 274)
$ChkOpenFolder.Size = New-Object System.Drawing.Size(580, 28)
$ChkOpenFolder.Font = $FontSub
$ChkOpenFolder.Checked = $false
$ChkOpenFolder.Text = '同時打開安裝資料夾檢視檔案'
$Page5.Controls.Add($ChkOpenFolder)

$ContentHost.Controls.AddRange(@($Page1, $Page2, $Page3, $Page4, $Page5))

$script:CurrentStep = 1
$script:InstalledLauncher = ''
$script:InstalledTargetDir = ''

function Append-Log([string]$msg) {
  $TxtLog.AppendText($msg + [Environment]::NewLine)
  $TxtLog.SelectionStart = $TxtLog.Text.Length
  $TxtLog.ScrollToCaret()
  [System.Windows.Forms.Application]::DoEvents()
}

function Set-Progress([int]$val, [string]$status) {
  $ProgressBar.Value = [Math]::Min(100, [Math]::Max(0, $val))
  $LblProgressStatus.Text = $status
  [System.Windows.Forms.Application]::DoEvents()
}

function Find-PythonCommand {
  $candidates = @(
    @{ exe = 'py'; args = '-3' },
    @{ exe = 'python'; args = '' },
    @{ exe = 'python3'; args = '' }
  )
  foreach ($c in $candidates) {
    try {
      $cmd = Get-Command $c.exe -ErrorAction SilentlyContinue
      if ($cmd) {
        $verArgs = if ($c.args) { "$($c.args) --version" } else { '--version' }
        $p = Start-Process -FilePath $c.exe -ArgumentList $verArgs -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
        if ($p -and $p.ExitCode -eq 0) {
          return $c
        }
      }
    } catch {}
  }
  return $null
}

function Create-DesktopShortcut([string]$lnkName, [string]$targetPath, [string]$workDir, [string]$desc) {
  try {
    $shell = New-Object -ComObject WScript.Shell
    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcut = $shell.CreateShortcut((Join-Path $desktop ($lnkName + '.lnk')))
    $shortcut.TargetPath = $targetPath
    $shortcut.WorkingDirectory = $workDir
    $shortcut.Description = $desc
    $shortcut.Save()
    Append-Log ("  已建立桌面捷徑：" + $lnkName)
  } catch {
    Append-Log ("  [提示] 建立桌面捷徑略過：" + $_.Exception.Message)
  }
}

function Run-Installation {
  $BtnBack.Enabled = $false
  $BtnNext.Enabled = $false
  $BtnCancel.Enabled = $false

  $targetDir = $TxtPath.Text.Trim()
  if (-not $targetDir) {
    $targetDir = Join-Path ([Environment]::GetFolderPath('Desktop')) $DefaultFolderName
  }
  $script:InstalledTargetDir = $targetDir

  try {
    Set-Progress 10 '正在建立安裝目錄與圖庫資料夾...'
    Append-Log ('目標安裝目錄：' + $targetDir)
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    $catsDir = Join-Path $targetDir 'cats'
    $inputDir = Join-Path $targetDir 'input_photos'
    New-Item -ItemType Directory -Force -Path $catsDir | Out-Null
    New-Item -ItemType Directory -Force -Path $inputDir | Out-Null

    $manifestFile = Join-Path $catsDir 'manifest.json'
    if (-not (Test-Path $manifestFile)) {
      [System.IO.File]::WriteAllText($manifestFile, '[]', (New-Object System.Text.UTF8Encoding($false)))
    }
    Append-Log '  已建立 cats/ 與初始化 cats/manifest.json（避免 404 錯誤）'

    Set-Progress 30 '正在複製最新版互動前端、本機伺服器與自動更新引擎...'
    Copy-Item -Path (Join-Path $AppSourceDir 'index.html') -Destination (Join-Path $targetDir 'index.html') -Force
    Copy-Item -Path (Join-Path $AppSourceDir 'server.py') -Destination (Join-Path $targetDir 'server.py') -Force
    if (Test-Path (Join-Path $AppSourceDir 'updater.py')) {
      Copy-Item -Path (Join-Path $AppSourceDir 'updater.py') -Destination (Join-Path $targetDir 'updater.py') -Force
    }
    if (Test-Path (Join-Path $AppSourceDir 'version.json')) {
      Copy-Item -Path (Join-Path $AppSourceDir 'version.json') -Destination (Join-Path $targetDir 'version.json') -Force
    }
    Append-Log '  已複製 index.html、server.py、updater.py 與 version.json'

    if ($ChkCamera.Checked -and (Test-Path (Join-Path $AppSourceDir 'camera_remove_bg.py'))) {
      Copy-Item -Path (Join-Path $AppSourceDir 'camera_remove_bg.py') -Destination (Join-Path $targetDir 'camera_remove_bg.py') -Force
      Append-Log '  已複製攝影機即時去背模組 camera_remove_bg.py'
    }
    if ($ChkFolderBg.Checked -and (Test-Path (Join-Path $AppSourceDir 'folder_remove_bg.py'))) {
      Copy-Item -Path (Join-Path $AppSourceDir 'folder_remove_bg.py') -Destination (Join-Path $targetDir 'folder_remove_bg.py') -Force
      Append-Log '  已複製資料夾自動去背模組 folder_remove_bg.py'
    }
    if (($ChkCamera.Checked -or $ChkFolderBg.Checked) -and (Test-Path (Join-Path $AppSourceDir 'requirements.txt'))) {
      Copy-Item -Path (Join-Path $AppSourceDir 'requirements.txt') -Destination (Join-Path $targetDir 'requirements.txt') -Force
    }

    Set-Progress 48 '正在檢查系統 Python 3 環境...'
    $pyInfo = Find-PythonCommand
    if (-not $pyInfo) {
      Append-Log '  尚未偵測到 Python 3。'
      $askPy = [System.Windows.Forms.MessageBox]::Show(
        "這台電腦尚未安裝 Python 3（啟動本機伺服器與去背需要 Python）。\`r\`n\`r\`n是否要讓安裝助手立即透過 Windows 內建 winget 自動下載並安裝 Python 3.12？\`r\`n（點「否」將開啟官方下載頁面）",
        '需要安裝 Python 3',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
      )
      if ($askPy -eq [System.Windows.Forms.DialogResult]::Yes) {
        Set-Progress 55 '正在透過 winget 自動安裝 Python 3.12（請稍候）...'
        Append-Log '  正在執行 winget install Python.Python.3.12...'
        $winget = Get-Command 'winget' -ErrorAction SilentlyContinue
        if ($winget) {
          Start-Process -FilePath 'winget' -ArgumentList 'install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements' -Wait
          $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
          $pyInfo = Find-PythonCommand
        } else {
          Start-Process 'https://www.python.org/downloads/'
        }
      } else {
        Start-Process 'https://www.python.org/downloads/'
      }
    } else {
      Append-Log ('  偵測到 Python 指令：' + $pyInfo.exe + ' ' + $pyInfo.args)
    }

    $needAiInstall = ($ChkCamera.Checked -or $ChkFolderBg.Checked)
    $venvPython = Join-Path $targetDir '.venv\\Scripts\\python.exe'
    if ($needAiInstall -and $pyInfo) {
      Set-Progress 65 '正在建立獨立 Python 虛擬環境 (.venv)...'
      Append-Log '  建立 .venv 中...'
      $venvArgs = if ($pyInfo.args) { "$($pyInfo.args) -m venv \`"$targetDir\\.venv\`"" } else { "-m venv \`"$targetDir\\.venv\`"" }
      Start-Process -FilePath $pyInfo.exe -ArgumentList $venvArgs -NoNewWindow -Wait

      if (Test-Path $venvPython) {
        Set-Progress 76 '正在安裝 OpenCV / Pillow / NumPy 去背套件（約需 1～2 分鐘）...'
        Append-Log '  執行 pip install -r requirements.txt...'
        $reqPath = Join-Path $targetDir 'requirements.txt'
        Start-Process -FilePath $venvPython -ArgumentList "-m pip install --upgrade pip" -NoNewWindow -Wait
        $pipProc = Start-Process -FilePath $venvPython -ArgumentList "-m pip install -r \`"$reqPath\`"" -NoNewWindow -Wait -PassThru
        if ($pipProc.ExitCode -eq 0) {
          Append-Log '  AI 去背影像套件安裝完成！'
        } else {
          Append-Log '  [提醒] 部分套件安裝未完成（可能無網路連線），網站與伺服器仍可正常運作。'
        }
      }
    }

    Set-Progress 88 '正在產生一鍵啟動器、更新還原工具與桌面捷徑...'
    $startBatPath = Join-Path $targetDir '啟動貓咪互動樂園.bat'
    $startBatContent = @"
@echo off
chcp 65001 >nul
title 跨界歸零｜貓咪互動樂園 本機伺服器
cd /d "%~dp0"
if exist ".venv\\Scripts\\python.exe" (
  if exist "updater.py" ".venv\\Scripts\\python.exe" updater.py --startup
  ".venv\\Scripts\\python.exe" server.py
) else (
  where py >nul 2>nul && (
    if exist "updater.py" py -3 updater.py --startup
    py -3 server.py
  ) || (
    if exist "updater.py" python updater.py --startup
    python server.py
  )
)
pause
"@
    [System.IO.File]::WriteAllText($startBatPath, $startBatContent, (New-Object System.Text.UTF8Encoding($false)))
    $script:InstalledLauncher = $startBatPath

    $updBatPath = Join-Path $targetDir '檢查更新與還原舊版.bat'
    $updBatContent = @"
@echo off
chcp 65001 >nul
title 跨界歸零｜版本更新與備份還原管理
cd /d "%~dp0"
if exist ".venv\\Scripts\\python.exe" (
  ".venv\\Scripts\\python.exe" updater.py --gui
) else (
  where py >nul 2>nul && (py -3 updater.py --gui) || (python updater.py --gui)
)
"@
    [System.IO.File]::WriteAllText($updBatPath, $updBatContent, (New-Object System.Text.UTF8Encoding($false)))

    if ($ChkCamera.Checked) {
      $camBatPath = Join-Path $targetDir '啟動攝影機去背.bat'
      $camBatContent = @"
@echo off
chcp 65001 >nul
title 跨界歸零｜攝影機拍照去背系統
cd /d "%~dp0"
if exist ".venv\\Scripts\\python.exe" (
  ".venv\\Scripts\\python.exe" camera_remove_bg.py
) else (
  where py >nul 2>nul && (py -3 camera_remove_bg.py) || (python camera_remove_bg.py)
)
pause
"@
      [System.IO.File]::WriteAllText($camBatPath, $camBatContent, (New-Object System.Text.UTF8Encoding($false)))
    }

    if ($ChkFolderBg.Checked) {
      $fldBatPath = Join-Path $targetDir '啟動資料夾監控去背.bat'
      $fldBatContent = @"
@echo off
chcp 65001 >nul
title 跨界歸零｜資料夾自動去背監視器
cd /d "%~dp0"
if exist ".venv\\Scripts\\python.exe" (
  ".venv\\Scripts\\python.exe" folder_remove_bg.py
) else (
  where py >nul 2>nul && (py -3 folder_remove_bg.py) || (python folder_remove_bg.py)
)
pause
"@
      [System.IO.File]::WriteAllText($fldBatPath, $fldBatContent, (New-Object System.Text.UTF8Encoding($false)))
    }

    if ($ChkShortcut.Checked) {
      Create-DesktopShortcut '啟動貓咪互動樂園' $startBatPath $targetDir '開啟跨界歸零｜貓咪互動樂園本機伺服器與網頁'
      if ($ChkCamera.Checked) {
        Create-DesktopShortcut '啟動貓咪攝影機去背' (Join-Path $targetDir '啟動攝影機去背.bat') $targetDir '啟動實體畫紙攝影機拍照去背系統'
      }
    }

    Set-Progress 100 '全部安裝步驟已完成！'
    Append-Log '✅ 所有檔案與設定已就緒。'

    $LblDoneBody.Text = @"
「跨界歸零｜貓咪互動樂園」已成功安裝至：
$targetDir

日後展覽開機時，只需直接雙擊桌面的「啟動貓咪互動樂園」捷徑，
瀏覽器就會自動開啟 http://localhost:${port}/ 進入互動樂園！

貼心快捷鍵：按 F 切換全螢幕、按 H 隱藏控制列、按 N 收合衛教便條。
"@
    Show-Step 5
  } catch {
    Append-Log ('[錯誤] 安裝過程發生異常：' + $_.Exception.Message)
    [System.Windows.Forms.MessageBox]::Show(
      ('安裝過程發生錯誤：' + $_.Exception.Message),
      '安裝失敗',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    )
    $BtnCancel.Enabled = $true
    $BtnBack.Enabled = $true
  }
}

function Show-Step([int]$step) {
  $script:CurrentStep = $step
  $Page1.Visible = ($step -eq 1)
  $Page2.Visible = ($step -eq 2)
  $Page3.Visible = ($step -eq 3)
  $Page4.Visible = ($step -eq 4)
  $Page5.Visible = ($step -eq 5)

  switch ($step) {
    1 {
      $HeaderTitle.Text = '歡迎使用「跨界歸零｜貓咪互動樂園」安裝助手'
      $HeaderDesc.Text = '步驟 1 / 5 · 依照畫面指引點擊同意與下一步，即可自動完成所有設定'
      $BtnBack.Enabled = $false
      $BtnNext.Enabled = $true
      $BtnNext.Text = '下一步 >'
      $BtnCancel.Enabled = $true
    }
    2 {
      $HeaderTitle.Text = '授權條款與本機權限說明'
      $HeaderDesc.Text = '步驟 2 / 5 · 請確認並勾選同意條款後繼續'
      $BtnBack.Enabled = $true
      $BtnNext.Enabled = $ChkAgree.Checked
      $BtnNext.Text = '同意並繼續 >'
      $BtnCancel.Enabled = $true
    }
    3 {
      $HeaderTitle.Text = '選擇安裝資料夾與功能模組'
      $HeaderDesc.Text = '步驟 3 / 5 · 已套用您的建議設定，也可在此微調'
      $BtnBack.Enabled = $true
      $BtnNext.Enabled = $true
      $BtnNext.Text = '開始安裝'
      $BtnCancel.Enabled = $true
    }
    4 {
      $HeaderTitle.Text = '正在自動安裝與設定環境'
      $HeaderDesc.Text = '步驟 4 / 5 · 請稍候，正在為您部署最新版網站與環境'
      $BtnBack.Enabled = $false
      $BtnNext.Enabled = $false
      $BtnNext.Text = '安裝中...'
      $BtnCancel.Enabled = $false
    }
    5 {
      $HeaderTitle.Text = '安裝完成'
      $HeaderDesc.Text = '步驟 5 / 5 · 您可以立刻啟動「跨界歸零｜貓咪互動樂園」'
      $BtnBack.Enabled = $false
      $BtnNext.Enabled = $true
      $BtnNext.Text = '完成'
      $BtnNext.BackColor = $ColorSage
      $BtnCancel.Enabled = $false
    }
  }
}

$ChkAgree.Add_CheckedChanged({
  if ($script:CurrentStep -eq 2) {
    $BtnNext.Enabled = $ChkAgree.Checked
  }
})

$BtnCancel.Add_Click({
  $res = [System.Windows.Forms.MessageBox]::Show(
    '確定要取消安裝「跨界歸零｜貓咪互動樂園」嗎？',
    '取消安裝',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question
  )
  if ($res -eq [System.Windows.Forms.DialogResult]::Yes) {
    $Form.Close()
  }
})

$BtnBack.Add_Click({
  if ($script:CurrentStep -gt 1 -and $script:CurrentStep -lt 4) {
    Show-Step ($script:CurrentStep - 1)
  }
})

$BtnNext.Add_Click({
  if ($script:CurrentStep -eq 1) {
    Show-Step 2
  } elseif ($script:CurrentStep -eq 2) {
    if ($ChkAgree.Checked) { Show-Step 3 }
  } elseif ($script:CurrentStep -eq 3) {
    Show-Step 4
    Run-Installation
  } elseif ($script:CurrentStep -eq 5) {
    if ($ChkOpenFolder.Checked -and $script:InstalledTargetDir) {
      Start-Process 'explorer.exe' -ArgumentList $script:InstalledTargetDir
    }
    if ($ChkLaunchNow.Checked -and (Test-Path $script:InstalledLauncher)) {
      Start-Process -FilePath $script:InstalledLauncher -WorkingDirectory $script:InstalledTargetDir
    }
    $Form.Close()
  }
})

Show-Step 1
[void]$Form.ShowDialog()
`;

  return script.replace(/\r?\n/g, '\r\n');
}

export function generateMacCommandInstaller(config: InstallConfig): string {
  const folderName = sanitizeFolderName(config.installFolderName);
  const bashFolder = escapeBashDoubleQuoted(folderName);
  const port = config.port;
  const includeAi = config.includeCameraBg || config.includeFolderBg;
  const includeCam = config.includeCameraBg ? '1' : '0';
  const includeFld = config.includeFolderBg ? '1' : '0';
  const createShortcut = config.createShortcut ? '1' : '0';

  const script = `#!/bin/bash
# 跨界歸零｜貓咪互動樂園 — macOS 原生圖形化安裝精靈
# 雙擊即可依序彈出「歡迎 → 同意條款 → 選擇位置與模式 → 自動安裝 → 立即啟動」視窗

set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_SRC="$SCRIPT_DIR/app"
DEFAULT_FOLDER="${bashFolder}"
PORT="${port}"
HAS_AI_PAYLOAD="${includeAi ? '1' : '0'}"
DEFAULT_CAM="${includeCam}"
DEFAULT_FLD="${includeFld}"
CREATE_SHORTCUT="${createShortcut}"

# 嘗試清除 macOS 下載隔離屬性（避免後續啟動被阻擋）
xattr -dr com.apple.quarantine "$SCRIPT_DIR" 2>/dev/null || true

# 步驟 1：歡迎畫面
osascript -e 'display dialog "歡迎使用「跨界歸零｜貓咪互動樂園」安裝助手！\\n\\n接下來只需依照畫面指引點擊「下一步」與「我同意」，系統將自動完成：\\n\\n• 部署最新版手作紙藝庭院互動前端\\n• 設定本機伺服器 (localhost:'"$PORT"') 與 manifest 自動同步\\n• 依選擇建置 Python 獨立虛擬環境與自動去背功能\\n• 建立一鍵雙擊啟動器，免再輸入終端機指令" with title "跨界歸零｜貓咪互動樂園 安裝精靈 (1/4)" buttons {"取消", "下一步 →"} default button "下一步 →"' >/dev/null 2>&1
if [ $? -ne 0 ]; then
  exit 0
fi

# 步驟 2：授權與權限同意
osascript -e 'display dialog "【安裝與本機使用條款】\\n\\n1. 本安裝助手僅在您指定的資料夾建立樂園程式、cats/ 與 input_photos/ 目錄，並預先初始化 cats/manifest.json。\\n2. 啟動後將在本機連接埠 '"$PORT"' 執行離線網站伺服器，不會上傳任何現場畫作。\\n3. 若選用 Python 去背模組，將自動建立獨立 .venv 虛擬環境，避免影響 macOS 系統環境。\\n\\n點擊「我同意並繼續」即表示您同意以上說明並開始選擇安裝設定。" with title "條款與權限同意 (2/4)" buttons {"不同意", "我同意並繼續"} default button "我同意並繼續"' >/dev/null 2>&1
if [ $? -ne 0 ]; then
  exit 0
fi

# 步驟 3：選擇安裝資料夾
LOC_CHOICE=$(osascript -e 'button returned of (display dialog "請選擇「跨界歸零｜貓咪互動樂園」的安裝位置：\\n\\n預設位置：桌面 / '"$DEFAULT_FOLDER"'" with title "選擇安裝位置 (3/4)" buttons {"取消", "自訂資料夾...", "安裝到桌面 (建議)"} default button "安裝到桌面 (建議)")' 2>/dev/null || echo "取消")

if [ "$LOC_CHOICE" = "取消" ]; then
  exit 0
elif [ "$LOC_CHOICE" = "自訂資料夾..." ]; then
  PARENT_DIR=$(osascript -e 'POSIX path of (choose folder with prompt "請選擇要放置「'"$DEFAULT_FOLDER"'」資料夾的位置：")' 2>/dev/null || echo "")
  if [ -z "$PARENT_DIR" ]; then
    exit 0
  fi
  TARGET_DIR="\${PARENT_DIR%/}/$DEFAULT_FOLDER"
else
  TARGET_DIR="$HOME/Desktop/$DEFAULT_FOLDER"
fi

# 步驟 4：選擇安裝模式
INSTALL_AI="0"
if [ "$HAS_AI_PAYLOAD" = "1" ]; then
  MODE_CHOICE=$(osascript -e 'button returned of (display dialog "請選擇要安裝的功能模組：\\n\\n• 完整安裝：含最新版前端、本機伺服器、Python 攝影機與資料夾去背（首次安裝需網路下載影像套件）\\n• 精簡安裝：僅安裝最新版前端與本機伺服器（約 5 秒完成）" with title "選擇功能模組 (4/4)" buttons {"取消", "精簡安裝", "完整安裝 (建議)"} default button "完整安裝 (建議)")' 2>/dev/null || echo "取消")
  if [ "$MODE_CHOICE" = "取消" ]; then
    exit 0
  elif [ "$MODE_CHOICE" = "完整安裝 (建議)" ]; then
    INSTALL_AI="1"
  fi
fi

echo "============================================================"
echo "🐾 正在安裝「跨界歸零｜貓咪互動樂園」至："
echo "   $TARGET_DIR"
echo "============================================================"

mkdir -p "$TARGET_DIR/cats" "$TARGET_DIR/input_photos"
if [ ! -f "$TARGET_DIR/cats/manifest.json" ]; then
  echo "[]" > "$TARGET_DIR/cats/manifest.json"
fi

cp -f "$APP_SRC/index.html" "$TARGET_DIR/index.html"
cp -f "$APP_SRC/server.py" "$TARGET_DIR/server.py"
[ -f "$APP_SRC/updater.py" ] && cp -f "$APP_SRC/updater.py" "$TARGET_DIR/updater.py"
[ -f "$APP_SRC/version.json" ] && cp -f "$APP_SRC/version.json" "$TARGET_DIR/version.json"
echo "✅ 已部署最新版前端 (index.html)、本機伺服器 (server.py) 與自動更新引擎 (updater.py)"

if [ "$INSTALL_AI" = "1" ]; then
  [ "$DEFAULT_CAM" = "1" ] && [ -f "$APP_SRC/camera_remove_bg.py" ] && cp -f "$APP_SRC/camera_remove_bg.py" "$TARGET_DIR/camera_remove_bg.py"
  [ "$DEFAULT_FLD" = "1" ] && [ -f "$APP_SRC/folder_remove_bg.py" ] && cp -f "$APP_SRC/folder_remove_bg.py" "$TARGET_DIR/folder_remove_bg.py"
  [ -f "$APP_SRC/requirements.txt" ] && cp -f "$APP_SRC/requirements.txt" "$TARGET_DIR/requirements.txt"
fi

# 偵測 Python 3
PYTHON_BIN=""
for cand in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null || true)"; do
  if [ -n "$cand" ] && [ -x "$cand" ]; then
    PYTHON_BIN="$cand"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  PY_ACTION=$(osascript -e 'button returned of (display dialog "系統尚未偵測到 Python 3。\\n\\n是否要開啟 Apple 開發者工具安裝精靈，或前往 python.org 下載官方安裝檔？" with title "需要 Python 3 環境" buttons {"稍後自行安裝", "開啟 python.org", "安裝 Apple 命令列工具"} default button "安裝 Apple 命令列工具")' 2>/dev/null || echo "稍後自行安裝")
  if [ "$PY_ACTION" = "安裝 Apple 命令列工具" ]; then
    xcode-select --install 2>/dev/null || true
  elif [ "$PY_ACTION" = "開啟 python.org" ]; then
    open "https://www.python.org/downloads/macos/"
  fi
else
  echo "✅ 偵測到 Python 3：$PYTHON_BIN"
  if [ "$INSTALL_AI" = "1" ] && [ -f "$TARGET_DIR/requirements.txt" ]; then
    echo "📦 正在建立獨立虛擬環境 (.venv) 並安裝去背影像套件（約 1～2 分鐘，請勿關閉視窗）..."
    "$PYTHON_BIN" -m venv "$TARGET_DIR/.venv"
    if [ -x "$TARGET_DIR/.venv/bin/python" ]; then
      "$TARGET_DIR/.venv/bin/python" -m pip install --upgrade pip >/dev/null 2>&1 || true
      "$TARGET_DIR/.venv/bin/python" -m pip install -r "$TARGET_DIR/requirements.txt" || echo "⚠️ 套件安裝未完全成功（請確認網路），網站與伺服器仍可正常運作。"
    fi
  fi
fi

# 建立一鍵啟動器 (.command) — 啟動前先快速檢查 GitHub 更新（斷網自動略過）
cat << 'EOF_LAUNCH' > "$TARGET_DIR/啟動貓咪互動樂園.command"
#!/bin/bash
cd "$(dirname "$0")"
if [ -x "./.venv/bin/python" ]; then
  PY_RUN="./.venv/bin/python"
elif [ -x "/opt/homebrew/bin/python3" ]; then
  PY_RUN="/opt/homebrew/bin/python3"
elif [ -x "/usr/local/bin/python3" ]; then
  PY_RUN="/usr/local/bin/python3"
else
  PY_RUN="python3"
fi
[ -f "./updater.py" ] && "$PY_RUN" updater.py --startup
"$PY_RUN" server.py
EOF_LAUNCH
chmod +x "$TARGET_DIR/啟動貓咪互動樂園.command"

# 建立手動檢查更新與備份還原工具
cat << 'EOF_UPD' > "$TARGET_DIR/檢查更新與還原舊版.command"
#!/bin/bash
cd "$(dirname "$0")"
if [ -x "./.venv/bin/python" ]; then
  PY_RUN="./.venv/bin/python"
elif [ -x "/opt/homebrew/bin/python3" ]; then
  PY_RUN="/opt/homebrew/bin/python3"
elif [ -x "/usr/local/bin/python3" ]; then
  PY_RUN="/usr/local/bin/python3"
else
  PY_RUN="python3"
fi
"$PY_RUN" updater.py --gui
EOF_UPD
chmod +x "$TARGET_DIR/檢查更新與還原舊版.command"

if [ "$INSTALL_AI" = "1" ] && [ -f "$TARGET_DIR/camera_remove_bg.py" ]; then
cat << 'EOF_CAM' > "$TARGET_DIR/啟動攝影機去背.command"
#!/bin/bash
cd "$(dirname "$0")"
if [ -x "./.venv/bin/python" ]; then
  ./.venv/bin/python camera_remove_bg.py
else
  python3 camera_remove_bg.py
fi
EOF_CAM
chmod +x "$TARGET_DIR/啟動攝影機去背.command"
fi

if [ "$INSTALL_AI" = "1" ] && [ -f "$TARGET_DIR/folder_remove_bg.py" ]; then
cat << 'EOF_FLD' > "$TARGET_DIR/啟動資料夾監控去背.command"
#!/bin/bash
cd "$(dirname "$0")"
if [ -x "./.venv/bin/python" ]; then
  ./.venv/bin/python folder_remove_bg.py
else
  python3 folder_remove_bg.py
fi
EOF_FLD
chmod +x "$TARGET_DIR/啟動資料夾監控去背.command"
fi

if [ "$CREATE_SHORTCUT" = "1" ]; then
  cat << EOF_DESK > "$HOME/Desktop/啟動貓咪互動樂園.command"
#!/bin/bash
cd "$TARGET_DIR"
if [ -x "./.venv/bin/python" ]; then
  PY_RUN="./.venv/bin/python"
elif [ -x "/opt/homebrew/bin/python3" ]; then
  PY_RUN="/opt/homebrew/bin/python3"
elif [ -x "/usr/local/bin/python3" ]; then
  PY_RUN="/usr/local/bin/python3"
else
  PY_RUN="python3"
fi
[ -f "./updater.py" ] && "\$PY_RUN" updater.py --startup
"\$PY_RUN" server.py
EOF_DESK
  chmod +x "$HOME/Desktop/啟動貓咪互動樂園.command"
  xattr -d com.apple.quarantine "$HOME/Desktop/啟動貓咪互動樂園.command" 2>/dev/null || true
fi

xattr -dr com.apple.quarantine "$TARGET_DIR" 2>/dev/null || true

DONE_ACTION=$(osascript -e 'button returned of (display dialog "🎉 安裝已成功完成！\\n\\n安裝位置：'"$TARGET_DIR"'\\n\\n日後只需雙擊「啟動貓咪互動樂園.command」即可自動開啟 http://localhost:'"$PORT"'/。\\n\\n是否要現在立刻啟動貓咪互動樂園？" with title "安裝完成" buttons {"稍後再說", "立即啟動樂園"} default button "立即啟動樂園")' 2>/dev/null || echo "稍後再說")

if [ "$DONE_ACTION" = "立即啟動樂園" ]; then
  open "$TARGET_DIR/啟動貓咪互動樂園.command"
fi
`;

  return script.replace(/\r\n/g, '\n');
}

export function generateReadmeTxt(config: InstallConfig): string {
  const folderName = sanitizeFolderName(config.installFolderName);
  const lines = [
    '============================================================',
    '跨界歸零｜貓咪互動樂園 — 跨平台一鍵安裝包說明',
    '============================================================',
    '',
    '【Windows 安裝步驟】',
    '1. 先將整個 ZIP 檔案「全部解壓縮」到任意資料夾（請勿直接在壓縮檔內點開）。',
    '2. 雙擊「點我開始安裝_Windows.bat」。',
    '   ※ 若出現藍色 Windows 保護視窗，請點「其他資訊」→「仍要執行」。',
    '3. 依照圖形化安裝精靈一路點擊「下一步 → 我同意 → 開始安裝 → 完成」即可！',
    '',
    '【macOS 安裝步驟】',
    '1. 雙擊 ZIP 檔案解壓縮。',
    '2. 對「點我開始安裝_Mac.command」按「右鍵（或兩指點按）」→ 選擇「打開」→ 再按「打開」。',
    '   ※ 若顯示權限不足，請在終端機輸入一次：chmod +x 並將該檔拖入後按 Enter，之後即可直接雙擊。',
    '3. 依照原生視窗精靈一路點擊「下一步 → 我同意並繼續 → 安裝到桌面 → 立即啟動樂園」即可！',
    '',
    '【預設安裝參數】',
    `- 安裝資料夾名稱：${folderName}`,
    `- 初始版本號：v${config.appVersion || '1.0.0'}`,
    `- 本機伺服器網址：http://localhost:${config.port}/`,
    `- 啟動自動檢查更新：${config.autoUpdateEnabled ? '已開啟' : '已關閉'}`,
    `- GitHub 更新來源：${config.updateSourceUrl || '（尚未設定）'}`,
    `- 攝影機去背模組：${config.includeCameraBg ? '已包含' : '未包含'}`,
    `- 資料夾去背模組：${config.includeFolderBg ? '已包含' : '未包含'}`,
    `- 自動建立桌面捷徑：${config.createShortcut ? '是' : '否'}`,
    '',
    '【自動更新與一鍵備份還原說明】',
    '- 每次雙擊「啟動貓咪互動樂園」時，系統會自動連線 GitHub 檢查是否有新版本（4 秒逾時，離線展場會自動略過）。',
    '- 偵測到新版將彈出系統原生通知視窗，按下「立即更新並重啟」會自動備份舊版至 .backups/ 並替換 index.html 與 server.py，完全保留 cats/ 貓咪圖庫。',
    '- 若需手動檢查更新或還原至更新前的舊版，請雙擊安裝資料夾內的「檢查更新與還原舊版」。',
    '',
    '【展場快捷鍵】',
    '- F：切換全螢幕投影',
    '- H：隱藏 / 顯示右下角控制條',
    '- N：收合 / 展開左上角衛教與 QR Code 便條',
    '- 1 / 2 / 3 / 4：切換春 / 夏 / 秋 / 冬場景氛圍',
    ''
  ];
  return lines.join('\r\n');
}
