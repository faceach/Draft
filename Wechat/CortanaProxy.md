# ReadMe

## Requirements
- Visual C++ 2010 redistributable
- Windows Server 2008 R2 or later.
- Visual Studio 2013 or later
- CoreXT enlistment

## Checkout
1. Install git.
2. In git bash, go to your enlistment folder and run 
>git clone https://msasg.visualstudio.com/DefaultCollection/Bing\_Cortana/\_git/HalseyChina 
3. After all are done, start a command prompt with admin privilege, run 
>HalseyChina\init.cmd

## Code path

> HalseyChina\private\cortanaproxy.zhcn.product\

## SSL Certificate
cortanaproxy.zhcn.product has two main projects, RPS.Azure and WeChatWorkerRole. 
Both of them require SSL certificate, you can find SSL certificate file(thumbprint: F3D54AFC9AE7427EBE8324E2A83D4285AF4CEB26) from
> HalseyChina\private\cortanaproxy.zhcn.product\WeChatWorkerRole\Certificate\cortanaproxy.cloudapp.net.pfx 

The password of private key is "CortanaOnWeChat". The validity period is 21 months, and will expire on 07 March 2018.
Please visit [SSL Administration](https://ssladmin/Details/429198) for details.

## Azure SDK

You can get Azure SDK in [Azure SDK for VS 2013 .net](https://go.microsoft.com/fwlink/?linkid=323510&clcid=0x409).

More versions are available in [Download Azure SDKs and Tools | Azure](https://azure.microsoft.com/en-us/downloads/).

## RPS.Azure
### Pre-Installation 
- In Visual Studio, 
>Tools > Options > Projects and Solutions > Web Project > Use the 64 bit version of IIS Express for web sites and projects. 

   Note that this setting is global to visual studio.

### Installation
1. Run 
> HalseyChina\private\cortanaproxy.zhcn.product\RPS.Azure\Startup\InstallRPS.cmd

   from an administrator command prompt.

2. Copy 
> HalseyChina\private\cortanaproxy.zhcn.product\WeChatWorkerRole\Certificate\cortanaproxy.cloudapp.net.cer

   to 
> C:/Program Files/Microsoft Passport RPS/config/certs/datakeys/ 

3. Install 
> HalseyChina\private\cortanaproxy.zhcn.product\WeChatWorkerRole\Certificate\cortanaproxy.cloudapp.net.pfx 
   
   to the Local Machine store. The password is "CortanaOnWeChat" . 

### [Adding the RPS OWIN middleware to a project](https://microsoft.sharepoint.com/teams/MSApartner/SitePages/RPS%20and%20OWIN.aspx)
The RPS OWIN middleware has dependencies on the Katana Microsoft.Owin.Security dll's, 
which in turn has dependencies on other DLL's from the Katana project. 
The RPS OWIN middleware ships with a NuGet package to resolve these dependencies automatically. 
To add the NuGet package to a Visual Studio project, right-click the project and select Manage Nuget Packages:

<img src="https://microsoft.sharepoint.com/teams/MSApartner/SiteAssets/SitePages/RPS%20and%20OWIN/vs_part1.png">

The NuGet package is included with the RPS installer and placed in the Owin subdirectory under the RPS install directory 
(usually C:\Program Files\Microsoft Passport RPS). 
This path needs to be added as a NuGet package source to add the package to Visual Studio, 
so choose "Settings" in the Manage Nuget Packages window:

<img src="https://microsoft.sharepoint.com/teams/MSApartner/SiteAssets/SitePages/RPS%20and%20OWIN/vs_part2.png">

Add a package source to \{RPS Install Directory\}\Owin, 
and select the added package source to find the "Microsoft.Owin.Security.RPS" package:

<img src="https://microsoft.sharepoint.com/teams/MSApartner/SiteAssets/SitePages/RPS%20and%20OWIN/vs_part3.png">

<img src="https://microsoft.sharepoint.com/teams/MSApartner/SiteAssets/SitePages/RPS%20and%20OWIN/vs_part4.png">

## Deploy

### Workflow
<img src="http://yuml.me/diagram/nofunky/activity/(start)->(Make your change)->(Deploy your change to Staging)->(Test against internal WeChat service account)->(Swap Staging and Production)->(Test against Product WeChat service account)-><a>[fail]->(Swap Staging and Production again)->(Make your change),<a>[pass]->(end)" >


