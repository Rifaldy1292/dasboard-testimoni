# check if script runs as administrator
If (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))
{
  # Relaunch as an elevated process:
  Start-Process powershell.exe "-File",('"{0}"' -f $MyInvocation.MyCommand.Path) -Verb RunAs
  exit
}

# HumanOS Variable definitions
$HS_SERVICENAME="HumanOS.IoT.Gateway.default"

sc.exe stop $HS_SERVICENAME
sc.exe delete $HS_SERVICENAME

pause