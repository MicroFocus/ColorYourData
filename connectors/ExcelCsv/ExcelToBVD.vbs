'This is an example that sends data to the sample_dashboard dashboard.
'Before you run it, make sure to get your API Key from the BVD System Settings UI.
'You may also have to specify a HTTP proxy.

'The example uses the row and col as dimensions and creates a value for it based on the row/col of the logical CSV cell    

'For extra tags use the variable below
StaticTags = "Excel"

'==========================================================================================

HostPort = UserInput ("Please enter the data receiver URI, e.g. https://receiver.coloryourdata.io/:")

ApiKey = UserInput ("Please enter your BVD API Key:")

Proxy = UserInput ("Host name of your HTTP proxy server (leave empty if not required):")

If Proxy <> "" Then
	Proxy = Proxy & ":" & UserInput ("Port name of your HTTP proxy server:")
End If

CSVPath = UserInput ("Please enter the path to the CSV File:")

StatusUrl = HostPort & "api/submit/"  & ApiKey & "/dims/row,col"

Set wshNetwork = WScript.CreateObject( "WScript.Network" )
sComputerName = wshNetwork.ComputerName

If StaticTags <> "" Then
  StatusUrl = StatusUrl & "/tags/" & StaticTags
End If

Set oHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")
oHTTP.setOption 2, 13056  ' NOTE: 13056 = SXH_SERVER_CERT_IGNORE_ALL_SERVER_ERRORS
If Proxy <> "" Then
  oHTTP.setProxy 2, Proxy
End If

Set objExcel = Wscript.CreateObject("Excel.Application")

Set objWorkbook = objExcel.Workbooks.Open(CSVPath)

objExcel.visible=False

rowCount=objExcel.ActiveWorkbook.Sheets(1).UsedRange.Rows.count
colCount=objExcel.ActiveWorkbook.Sheets(1).UsedRange.Columns.count

Wscript.Echo "Rows    : " & rowCount
Wscript.Echo "Columns : " & colCount


for i=1 to rowCount  step 1

  for j=1 to colCount step 1  

    If (StrComp((objExcel.Cells(i, j).Value),"")) Then
    
      value = objExcel.Cells(i, j).Value
      WScript.Echo current
      sRequest = GenSampleMsg(value, i, j)
      resp = HTTPPost(StatusUrl, sRequest)
      Wscript.Echo sRequest

      Wscript.Echo resp
      
    End If
  
  Next 

Next
 
Function HTTPPost(sUrl, sRequest)
  Wscript.Echo "Sending sample data to " & sUrl
  oHTTP.open "POST", sUrl, false
  oHTTP.setRequestHeader "Content-Type", "application/json"
  oHTTP.setRequestHeader "Content-Length", Len(sRequest)
  oHTTP.send sRequest
  HTTPPost = oHTTP.Status & " " & oHTTP.StatusText
End Function

Function GenSampleMsg(value, row, col)
  'Create a JSON document 
    
  res = "{" 
  res = res & Q("system") & ":" & Q(sComputerName) & ","
  res = res & Q("row") & ":" & Q("row-" & row) & "," 
  res = res & Q("col") & ":" & Q("col-" & col) & "," 
  res = res & Q("value") & ":" & Q(value) 
  res = res & "}"
  
  GenSampleMsg = res
End Function

Function Q(s)
  Q = chr(34) & s & chr(34)
End Function


Function UserInput( prompt )
    ' Check if the script runs in CSCRIPT.EXE
    If UCase( Right( WScript.FullName, 12 ) ) = "\CSCRIPT.EXE" Then
        ' If so, use StdIn and StdOut
        WScript.StdOut.Write prompt & " "
        UserInput = WScript.StdIn.ReadLine
    Else
        ' If not, use InputBox( )
        UserInput = InputBox( prompt )
    End If
End Function
