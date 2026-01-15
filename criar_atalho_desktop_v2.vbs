Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Smart Inventory System.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

' Usar o script de debug que mostra tudo
oLink.TargetPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\INICIAR_SISTEMA_DEBUG.bat"
oLink.WorkingDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
oLink.Description = "Inicia o Smart Inventory System - Sistema de Controle de Estoque"
oLink.IconLocation = "C:\Windows\System32\shell32.dll,137"
oLink.WindowStyle = 1  ' Janela normal (não minimizada)
oLink.Save

WScript.Echo "Atalho atualizado com sucesso!" & vbCrLf & vbCrLf & "Agora use o arquivo INICIAR_SISTEMA_DEBUG.bat para ver todas as mensagens."
