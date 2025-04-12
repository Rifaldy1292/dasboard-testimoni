# check if script runs as administrator
If (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))
{
  # Relaunch as an elevated process:
  Start-Process powershell.exe "-File",('"{0}"' -f $MyInvocation.MyCommand.Path) -Verb RunAs
  exit
}

# HumanOS Variable definitions
$InstalledRuntimesPath = "${env:ProgramFiles(x86)}\CyberTech\"
$SelectedRuntime = $null
$SelectedRuntimeExe = $null
$ScriptPath = $MyInvocation.MyCommand.Path
if ($ScriptPath -eq $null)
{
  $ScriptPath = Get-Location
}
else
{
  $ScriptPath = Split-Path -Parent $ScriptPath
}
$HS_SERVICENAME="HumanOS.IoT.Gateway.default"
$HS_DISPLAYNAME="HumanOS.IoT.Gateway for default"
$HS_DESC=""
$HS_STARTTYPE="auto"
$HS_APPSETTINGSDIR=$ScriptPath

# Windows form assemblys for runtime selection
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# add runtime dialog
Function AddRuntimeDialog()
{
  $FileBrowser = New-Object System.Windows.Forms.OpenFileDialog -Property @{
    Filter = 'HumanOS Runtimes (HumanOS.PlatformDefinitions.xml)|HumanOS.PlatformDefinitions.xml'
  }
  $DialogResult = $FileBrowser.ShowDialog()

  if ($DialogResult -eq [System.Windows.Forms.DialogResult]::OK)
  {
    AddRuntime($FileBrowser.FileName)
  }
}

# add runtime function
Function AddRuntime($PlatformDefinitionFile)
{
  $PlatformDefinitionXml = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/DetailedVersion'
  $Name = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/Name' | ForEach-Object { $_.Node.InnerText }
  $Edition = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/Edition' | ForEach-Object { $_.Node.InnerText }
  $Version = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/Version' | ForEach-Object { $_.Node.InnerText }
  $DetailedVersion = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/DetailedVersion' | ForEach-Object { $_.Node.InnerText }
  $Executable = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/Executable' | ForEach-Object { $_.Node.InnerText }
  $Description = Select-Xml -Path "$PlatformDefinitionFile" -XPath '/*/Description' | ForEach-Object { $_.Node.InnerText }

  # get executable path
  if ($Executable -eq $null)
  {
    $Executable = 'HumanOS.IoT.Gateway.exe'
  }
  $RuntimeDirectory = Split-Path -Parent $PlatformDefinitionFile
  $ExecutablePath = "$RuntimeDirectory\$Executable"

  $Runtime = New-Object System.Windows.Forms.ListViewItem($Name)
  $Dummy = $Runtime.SubItems.Add($DetailedVersion)
  $Dummy = $Runtime.SubItems.Add($Edition)
  $Dummy = $Runtime.SubItems.Add($ExecutablePath)
  $Dummy = $ListBox.Items.Add($Runtime)
}

# Windows form objects for select runtime dialog
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Select a Runtime'
$form.Size = New-Object System.Drawing.Size(400,300)
$form.StartPosition = 'CenterScreen'

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(225,220)
$cancelButton.Size = New-Object System.Drawing.Size(75,23)
$cancelButton.Text = 'Cancel'
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $cancelButton
$form.Controls.Add($cancelButton)

$addButton = New-Object System.Windows.Forms.Button
$addButton.Location = New-Object System.Drawing.Point(75,220)
$addButton.Size = New-Object System.Drawing.Size(75,23)
$addButton.Text = 'Add'
$addButton.Add_Click({AddRuntimeDialog})
$form.AcceptButton = $addButton
$form.Controls.Add($addButton)

$okButton = New-Object System.Windows.Forms.Button
$okButton.Location = New-Object System.Drawing.Point(150,220)
$okButton.Size = New-Object System.Drawing.Size(75,23)
$okButton.Text = 'OK'
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $okButton
$form.Controls.Add($okButton)

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(10,20)
$label.Size = New-Object System.Drawing.Size(380,20)
$label.Text = 'Please select an installed runtime:'
$form.Controls.Add($label)

$listBox = New-Object System.Windows.Forms.ListView
$listBox.Location = New-Object System.Drawing.Point(10,40)
$listBox.Size = New-Object System.Drawing.Size(360,170)
$listBox.Height = 170
$ListBox.GridLines=$false
$ListBox.MultiSelect=$false
$ListBox.View = "Details"
$ListBox.FullRowSelect  = $True
$Dummy = $ListBox.Columns.Add('Name', 216)
$Dummy = $ListBox.Columns.Add('Version', 70)
$Dummy = $ListBox.Columns.Add('Edition', 70)
$Dummy = $ListBox.Columns.Add('Executable', 0)

# Script logic
Write-Host "Scan HumanOS runtimes..."

foreach($PlatformDefinitionFile in Get-ChildItem -Path $InstalledRuntimesPath -Filter HumanOS.PlatformDefinitions.xml -Recurse -File | % { $_.FullName })
{
  AddRuntime($PlatformDefinitionFile)
}

$form.Controls.Add($listBox)
$form.Topmost = $true

$result = $form.ShowDialog()

if ($result -eq [System.Windows.Forms.DialogResult]::OK)
{
  $SelectedRuntime = $listBox.SelectedItems[0].SubItems[0].Text
  $SelectedRuntimeExe = $listBox.SelectedItems[0].SubItems[3].Text
}

if ($SelectedRuntimeExe -ne $null)
{
  $HS_BINPATH=$SelectedRuntimeExe

  Write-Host ""
  Write-Host "Service Name       = '$HS_SERVICENAME'"
  Write-Host "Selected Runtime   = '$SelectedRuntime'"
  Write-Host "Service executable = '$HS_BINPATH'"
  Write-Host "AppSettingsDir     = '$HS_APPSETTINGSDIR'"
  Write-Host ""
  Write-Host "Press Enter to register service..."
  Read-Host

  sc.exe stop $HS_SERVICENAME
  sc.exe delete $HS_SERVICENAME
  sc.exe create $HS_SERVICENAME binpath="$HS_BINPATH -AppSettingsDir=\""$HS_APPSETTINGSDIR\""" DisplayName=$HS_DISPLAYNAME start=$HS_STARTTYPE

  if ($HS_DESC -ne "")
  {
    sc.exe description $HS_SERVICENAME $HS_DESC
  }
}
else
{
  Write-Host ""
  Write-Host "No runtime selected."
}

pause
