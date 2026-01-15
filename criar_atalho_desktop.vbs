Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Smart Inventory System.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

' Caminho do arquivo .bat
oLink.TargetPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\INICIAR_SISTEMA.bat"
oLink.WorkingDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
oLink.Description = "Inicia o Smart Inventory System - Sistema de Controle de Estoque"
oLink.IconLocation = "C:\Windows\System32\shell32.dll,137"
oLink.WindowStyle = 1
oLink.Save

WScript.Echo "Atalho criado com sucesso na area de trabalho!" & vbCrLf & vbCrLf & "Nome: Smart Inventory System.lnk" & vbCrLf & vbCrLf & "Agora voce pode abrir o sistema com um duplo clique no atalho!"
