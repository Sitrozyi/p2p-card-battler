@echo off
chcp 65001 >nul
echo .jsファイルを .txt に一括変換します...
for %%f in (*.js) do ren "%%f" "%%f.txt"
echo 完了しました！
pause