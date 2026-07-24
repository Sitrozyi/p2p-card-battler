@echo off
chcp 65001 >nul
echo .js.txtファイルを .js に戻します...
for %%f in (*.js.txt) do ren "%%f" "%%~nf"
echo 完了しました！
pause