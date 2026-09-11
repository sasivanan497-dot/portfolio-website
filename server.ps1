$port = 8080
$path = "e:\port\image"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Listening on http://localhost:$port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = Join-Path -Path $path -ChildPath $request.Url.LocalPath.TrimStart('/')
    if (Test-Path -Path $filePath -PathType Container) {
        $filePath = Join-Path -Path $filePath -ChildPath "index.html"
    }

    if (Test-Path -Path $filePath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = "application/octet-stream"
        switch ($extension) {
            ".html" { $contentType = "text/html" }
            ".css"  { $contentType = "text/css" }
            ".js"   { $contentType = "application/javascript" }
            ".webp" { $contentType = "image/webp" }
        }
        $response.ContentType = $contentType
        
        $output = $response.OutputStream
        $output.Write($content, 0, $content.Length)
        $output.Close()
    } else {
        $response.StatusCode = 404
        $response.Close()
    }
}
