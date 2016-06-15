'This is an example that sends data to the sample_dashboard dashboard.
'Before you run it, make sure to get your API Key from the BVD System Settings UI.
'You may also have to specify a HTTP proxy.

'The example uses a predefined set of dynamic tags, that matches the example dashboard
'However you can add extra static tags here to create individual data streams when creating new dashboards
'or modifying the existing ones    

'Your extra static tags separated by commas
StaticTags4EventStatus = "omi,mdb"
StaticTags4KPIStatus = "omi,kpi"

'==========================================================================================

HostPort = UserInput ("Please enter the data receiver URI, e.g. https://receiver.coloryourdata.io/:")
ApiKey = UserInput ("Please enter your BVD API Key:")
Proxy = UserInput ("Host name of your HTTP proxy server (leave empty if not required):")
If Proxy <> "" Then
	Proxy = Proxy & ":" & UserInput ("Port name of your HTTP proxy server:")
End If

sEventStatusUrl = HostPort & "api/submit/"  & ApiKey & "/dims/mdb,label,type"

sKPIStatusUrl = HostPort & "api/submit/"  & ApiKey & "/dims/viewName,ciName,kpiName"

Set wshNetwork = WScript.CreateObject( "WScript.Network" )
sComputerName = wshNetwork.ComputerName

If StaticTags4EventStatus <> "" Then
  sEventStatusUrl = sEventStatusUrl & "/tags/" & StaticTags4EventStatus
End If
If StaticTags4KPIStatus <> "" Then
  sKPIStatusUrl = sKPIStatusUrl & "/tags/" & StaticTags4KPIStatus
End If

Set oHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")
oHTTP.setOption 2, 13056  ' NOTE: 13056 = SXH_SERVER_CERT_IGNORE_ALL_SERVER_ERRORS
If Proxy <> "" Then
  oHTTP.setProxy 2, Proxy
End If

'Loop forever and send a message every 2 seconds
Do While True
  sRequest = GenSampleEventStatusMsg()
  resp = HTTPPost(sEventStatusUrl, sRequest)
  Wscript.Echo resp
  
  sRequest = GenSampleKPIStatusMsg()
  resp = HTTPPost(sKPIStatusUrl, sRequest)
  Wscript.Echo resp
  
  WScript.Sleep 3000
Loop

Function HTTPPost(sUrl, sRequest)
  Wscript.Echo "Sending sample data to " & sUrl
  oHTTP.open "POST", sUrl, false
  oHTTP.setRequestHeader "Content-Type", "application/json"
  oHTTP.setRequestHeader "Content-Length", Len(sRequest)
  oHTTP.send sRequest
  HTTPPost = oHTTP.Status & " " & oHTTP.StatusText
End Function

Function GenSampleEventStatusMsg()
  'Create a JSON document with random numbers for the HTTP request body
  numberOfCritical = Int(100*Rnd) Mod 2
  numberOfMajor = Int(100*Rnd) Mod 4
  numberOfMinor = Int(100*Rnd) Mod 8
  numberOfNormal = Int(100*Rnd) Mod 10
  
  res = "{" 
  res = res & Q("omiSystem") & ":" & Q(sComputerName) & ","
  res = res & Q("mdb") & ":" & Q("OMi Health Status") & "," 
  res = res & Q("label") & ":" & Q("Overall") & ","
  res = res & Q("type") &  ":" & Q("PIE") & ","
  res = res & Q("filterName") &  ":" & Q("OMi Health Status Overall") & ","
  res = res & Q("viewFilterName") &  ":" & Q("OMi Deployment with HP Operations Agents") & ","
  res = res & Q("filterStatus") &  ":" & Q("FILTER_OK") & ","
  res = res & Q("id") & ":" & Q("6b7e4cd9-3a59-4a21-afff-9def580ae6b7") & ","
  res = res & Q("mostCritical") & ":" & Q(GetMostCritical(numberOfCritical, numberOfMajor, numberOfMinor)) & ","
  res = res & Q("numberOfCritical") & ":" & numberOfCritical & "," 
  res = res & Q("numberOfMajor")    & ":" & numberOfMajor & "," 
  res = res & Q("numberOfMinor")    & ":" & numberOfMinor & "," 
  res = res & Q("numberOfNormal")    & ":" & Int(10*Rnd) & "," 
  res = res & Q("numberOfUnknown")   & ":" & Int(4*Rnd) 
  res = res & "}"
  GenSampleEventStatusMsg = res
End Function

Function GetMostCritical(numberOfCritical, numberOfMajor, numberOfMinor)
  res = "UNKNOWN"
  If numberOfCritical > 0 Then
    res = "CRITICAL"
  ElseIf numberOfMajor > 0 Then
    res = "MAJOR"
  ElseIf numberOfMinor > 0 Then
    res = "MINOR"
  Else
    res = "NORMAL"
  End If  
  'Wscript.Echo "Numbers: " & numberOfCritical & "," & numberOfMajor & "," & numberOfMinor & "," & res
  GetMostCritical = res
End Function

Function GenSampleKPIStatusMsg()
  'Create a JSON document with random numbers for the HTTP request body
  res = "[{" 
  res = res & Q("omiSystem") & ":" & Q(sComputerName) & ","
  res = res & Q("viewName") & ":" & Q("OprSample") & "," 
  res = res & Q("ciId") & ":" & Q("77fe95ce6e4c2079a8d23ee3c99cbb38") & ","
  res = res & Q("ciName") & ":" & Q("IT JBoss Cluster") & ","
  res = res & Q("ciType") & ":" & Q("loadbalancecluster") & ","
  res = res & Q("kpiName") &  ":" & Q("System Performance") & ","
  res = res & Q("kpiId") &  ":" & Int(1002) & ","
  res = res & Q("status")   & ":" & Q(GetRandomKPIStatus((1000*Rnd) Mod 8))
  res = res & "},{"
  res = res & Q("omiSystem") & ":" & Q(sComputerName) & ","
  res = res & Q("viewName") & ":" & Q("OprSample") & "," 
  res = res & Q("ciId") & ":" & Q("3087b5bebfc243d3a1e1ac0046c3c050") & ","
  res = res & Q("ciName") & ":" & Q("Employee Self Service") & ","
  res = res & Q("ciType") & ":" & Q("j2eeapplication") & ","
  res = res & Q("kpiName") &  ":" & Q("Unassigned Events") & ","
  res = res & Q("kpiId") &  ":" & Int(7800) & ","
  res = res & Q("status")   & ":" & Q(GetRandomKPIStatus((1000*Rnd) Mod 8))
  res = res & "}]"
  GenSampleKPIStatusMsg = res
End Function

Function GetRandomKPIStatus(id)
  res = "Unknown"
  Select Case id
    Case 0
      res = "Critical"
    Case 1
      res = "Major"
    Case 2
      res = "Minor"
    Case 3
      res = "Warning"
    Case 4
      res = "Info"
    Case 5
      res = "OK"
    Case 6
      res = "Downtime"
    Case 7
      res = "No Data"
    Case else
      res = "Unknown"
  End Select
  GetRandomKPIStatus = res
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
