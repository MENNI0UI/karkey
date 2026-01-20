
$TaskName = "KarkeyAuctionReminder"
$Url = "http://localhost:3000/api/cron/reminders"
$LogFile = "$PSScriptRoot\..\cron-log.txt"

# Action: Run curl
# We use 'powershell' as the executable to pipe output easily or just curl if available.
# Simplest: Execute curl directly.
$Action = New-ScheduledTaskAction -Execute "curl.exe" -Argument "$Url >> $LogFile"

# For testing: Run once immediately (after 1 minute to allow setup)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)

# For testing purposes, you might want it to run every 5 minutes. Uncomment below to switch.
# $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 1)

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

Write-Host "Registering task: $TaskName"
Write-Host "URL: $Url"
Write-Host "Note: Your local server (npm start) must be running for this to work!"

# Unregister if exists to update
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Register
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal

Write-Host "Task created successfully. It will run every Saturday at 12:00 AM (Midnight)."
Write-Host "To run it manually now for testing, open Task Scheduler or run: Start-ScheduledTask -TaskName '$TaskName'"
