# PowerShell script to update confirm dialogs
$files = @(
    "app/dashboard/doctors/page.tsx",
    "app/dashboard/medicines/page.tsx",
    "app/dashboard/appointments/page.tsx",
    "app/dashboard/prescriptions/page.tsx",
    "app/dashboard/lab/page.tsx",
    "app/dashboard/radiology/page.tsx",
    "app/dashboard/pharmacy/page.tsx",
    "app/dashboard/reception/page.tsx",
    "app/dashboard/cashier/page.tsx",
    "app/dashboard/invoices/page.tsx"
)

foreach ($file in $files) {
    $fullPath = "c:\Users\ASUS\Desktop\next\hospital-frontend\$file"
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..."

        # Read file content
        $content = Get-Content $fullPath -Raw

        # Add import if not exists
        if ($content -notmatch "useConfirm") {
            $content = $content -replace "import \{ toast \} from 'react-toastify';", "import { toast } from 'react-toastify';`nimport { useConfirm } from '@/hooks/useConfirm';"

            # Add hook declaration
            $content = $content -replace "export default function \w+Page\(\) \{", "export default function $($file -replace '.*/', '' -replace 'page.tsx', 'Page')() {`n  const { confirm, ConfirmComponent } = useConfirm();"
        }

        # Save file
        Set-Content $fullPath -Value $content -NoNewline

        Write-Host "Updated $file"
    }
}

Write-Host "Done!"
