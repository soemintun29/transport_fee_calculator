import json, re
from pathlib import Path
text = Path(__file__).resolve().parents[1].joinpath("src/data/servicePricing.ts").read_text(encoding="utf-8")
std = json.loads(re.search(r"export const standardFees = (\[.*?\]) as const", text, re.S).group(1))
cac = json.loads(re.search(r"export const cacFees = (\[.*?\]) as const", text, re.S).group(1))
row = next(r for r in std if r["pd"]=="RAC" and "< 12000" in r["category"] and r["serviceCategory"].startswith("Repairing"))
assert row["serviceFee"]==30000 and row["diagnosisFee"]==15000, row
row2 = next(r for r in std if r["pd"]=="LAD" and r["category"]=="Front Load" and "Cleaning" in r["serviceCategory"])
assert row2["serviceFee"]==70000, row2
comp = next(r for r in cac if r["jobDetail"] and "Compressor" in r["jobDetail"] and r["capacity"] and "1.5HP" in r["capacity"])
assert comp["customerFee"]==88000, comp
print("price checks ok", len(std), "standard", len(cac), "cac")
