---
title: "VBA output UTF-8 text file"
description: "Fixing a VBA automation script so it writes UTF-8 text files that correctly preserve accented characters on both MacOS and Windows."
pubDatetime: 2021-02-13T12:00:00Z
tags:
  - vba
  - excel
  - notes
draft: false
---

At work I have to do some VBA automation script for a project. At first after I finished, I tested it and found it can't handle accent characters. If the output contains those characters, it gets changed to junk characters. That's because the way I output is not output as utf-8 file. So I googled to find the solution and put it here.

This was the way I did before the fix. It doesn't support utf-8.

```vb
Open fileName For Output As #1
Print #1, "somrthing áéùÀÈ"
Close #1
```

This is the code after fix for MacOS & Windows. Accent characters are supported properly.

```vb
    Sub GenerateEnterprise()
        If isMac() Then
            Open fileFullName For Binary Access Write As #fileNumber
            Put #fileNumber, 1, &HFE
            Put #fileNumber, 2, &HFF
        Else
            'Create Stream object
            Set fsT = CreateObject("ADODB.Stream")

            'Specify stream type - we want To save text/string data.
            fsT.type = 2

            'Specify charset For the source text data.
            fsT.Charset = "utf-8"

            'Open the stream And write binary data To the object
           fsT.Open
        End If

        Call outputToFile("Something ... áéùÀÈ", fsT, entFileNumber)

        If isMac() Then
            Close #fileNumber
        Else
            'Save binary data To disk

            fsT.SaveToFile fileFullName, 2
        End If

    End Sub

    Function outputToFile(ByVal text As String, fsT As Object, fileNumber As Integer)
        If isMac() Then
            Call printLineUtf16(fileNumber, text)
        Else
            fsT.writetext text & vbCr
        End If
    End Function

    Function printLineUtf16(fnum As Integer, str As String)
        str = str & ChrW(10)            'append newline
        Dim data() As Byte              'coerce string to bytes

        data = str

        Put #fnum, LOF(fnum) + 1, data  'append bytes to file
    End Function
```
