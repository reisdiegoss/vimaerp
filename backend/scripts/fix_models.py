import os
import glob
import re

model_dir = r"c:\Users\Diego Reis\Documents\DEV\VimaERP\backend\app\models"
files = glob.glob(os.path.join(model_dir, "*.py"))

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix tenant_id
    content = re.sub(
        r"tenant_id:\s*Mapped\[int\]\s*=\s*mapped_column\(BigInteger",
        r"tenant_id: Mapped[str] = mapped_column(String(26)",
        content
    )
    
    # Fix filial_id
    content = re.sub(
        r"filial_id:\s*Mapped\[int\]\s*=\s*mapped_column\(BigInteger\)",
        r"filial_id: Mapped[str] = mapped_column(String(26))",
        content
    )

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)

print("Models corrigidos para String(26) em tenant_id e filial_id!")
