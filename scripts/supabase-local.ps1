param(
    [string]$Accion = "status"
)

switch ($Accion) {
    "start" {
        Write-Host "Iniciando Supabase Local en Docker..." -ForegroundColor Cyan
        npx supabase start
    }
    "stop" {
        Write-Host "Deteniendo Supabase Local..." -ForegroundColor Yellow
        npx supabase stop
    }
    "reset" {
        Write-Host "Reseteando base de datos local y corriendo migraciones/seeds..." -ForegroundColor Magenta
        npx supabase db reset
    }
    "status" {
        npx supabase status
    }
    default {
        Write-Host "Uso: .\scripts\supabase-local.ps1 [start|stop|reset|status]" -ForegroundColor Gray
    }
}
