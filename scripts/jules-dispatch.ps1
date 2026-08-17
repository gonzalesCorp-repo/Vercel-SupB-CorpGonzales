<#
.SYNOPSIS
    Script Helper para despachar y gestionar tareas asíncronas en Google Jules desde Antigravity.
.DESCRIPTION
    Permite enviar prompts a Jules en la nube, listar sesiones activas y aplicar resultados generados.
.EXAMPLE
    .\scripts\jules-dispatch.ps1 -Action new -Prompt "Escribe pruebas unitarias para src/services/sunatPSE.ts"
    .\scripts\jules-dispatch.ps1 -Action list
    .\scripts\jules-dispatch.ps1 -Action teleport -SessionId "123456"
#>

param(
    [ValidateSet("new", "list", "pull", "teleport", "login", "status")]
    [string]$Action = "list",

    [string]$Prompt = "",
    [string]$SessionId = "",
    [int]$Parallel = 1
)

Write-Host "🤖 [Google Jules Runner - Antigravity]" -ForegroundColor Cyan

switch ($Action) {
    "login" {
        Write-Host "🔐 Iniciando autenticación con Google Jules..." -ForegroundColor Yellow
        jules login
    }
    "new" {
        if (-not $Prompt) {
            Write-Error "Debes especificar un prompt con -Prompt 'descripcion de la tarea'"
            exit 1
        }
        Write-Host "🚀 Despachando tarea asíncrona a Jules en Google Cloud..." -ForegroundColor Green
        Write-Host "📝 Prompt: $Prompt" -ForegroundColor Gray
        if ($Parallel -gt 1) {
            jules new --parallel $Parallel "$Prompt"
        } else {
            jules new "$Prompt"
        }
    }
    "list" {
        Write-Host "📋 Listando sesiones activas e históricas de Jules..." -ForegroundColor Yellow
        jules remote list --session
    }
    "pull" {
        if (-not $SessionId) {
            Write-Error "Debes especificar el ID de sesión con -SessionId <id>"
            exit 1
        }
        Write-Host "📥 Descargando y aplicando patch de la sesión $SessionId..." -ForegroundColor Green
        jules remote pull --session $SessionId --apply
    }
    "teleport" {
        if (-not $SessionId) {
            Write-Error "Debes especificar el ID de sesión con -SessionId <id>"
            exit 1
        }
        Write-Host "⚡ Teletransportando cambios de la sesión $SessionId al entorno local..." -ForegroundColor Cyan
        jules teleport $SessionId
    }
    "status" {
        jules version
        jules remote list --repo
    }
}
