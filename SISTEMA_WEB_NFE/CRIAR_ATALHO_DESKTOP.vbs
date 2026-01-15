Set oWS = WScript.CreateObject("WScript.Shell")

' Obter caminho do script atual
strScriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Caminho do arquivo .bat para executar
strBatPath = strScriptPath & "\INICIAR_SISTEMA.bat"

' Caminho da area de trabalho
strDesktop = oWS.SpecialFolders("Desktop")

' Nome do atalho
strLinkFile = strDesktop & "\Sistema Web NF-e.lnk"

' Criar atalho
Set oLink = oWS.CreateShortcut(strLinkFile)
oLink.TargetPath = strBatPath
oLink.WorkingDirectory = strScriptPath
oLink.Description = "Inicia o Sistema Web de Cadastro de NF-e - Produtos Quimicos"
oLink.IconLocation = "C:\Windows\System32\shell32.dll,137"
oLink.WindowStyle = 1  ' Janela normal
oLink.Save

WScript.Echo "Atalho criado com sucesso na area de trabalho!" & vbCrLf & vbCrLf & "Nome: Sistema Web NF-e.lnk" & vbCrLf & vbCrLf & "Agora voce pode abrir o sistema com dois cliques no atalho!"
