# -*- coding: utf-8 -*-
"""Generate src/data/servicePricing.ts from 20260728_Service Charges.xlsx"""
from __future__ import annotations

import json
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "20260728_Service_Charges.xlsx"
if not XLSX.exists():
    XLSX = Path(r"D:\My_AI_Team\_20260728_Service_Charges.xlsx")
OUT = ROOT / "src" / "data" / "servicePricing.ts"


def merged_value(ws: Worksheet, row: int, col: int):
    v = ws.cell(row, col).value
    if v is not None and str(v).strip() != "":
        return v
    for rng in ws.merged_cells.ranges:
        min_col, min_row, max_col, max_row = rng.bounds
        if min_row <= row <= max_row and min_col <= col <= max_col:
            return ws.cell(min_row, min_col).value
    return None


def as_text(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def as_money(v) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def parse_standard(ws: Worksheet) -> list[dict]:
    rows: list[dict] = []
    pd = ""
    category = ""
    for r in range(4, ws.max_row + 1):
        a = as_text(merged_value(ws, r, 1))
        b = as_text(merged_value(ws, r, 2))
        c = as_text(merged_value(ws, r, 3))
        fee = as_money(merged_value(ws, r, 4))
        diag = as_money(merged_value(ws, r, 5))
        if a and a.lower().startswith("updated"):
            continue
        if a and ("FOC" in a or "Warranty" in a or "မည်သည့်" in a):
            continue
        if a and a.upper() not in {"PD"}:
            if a in {"Service Charge Matrix"}:
                continue
            pd = a
            if not b:
                category = ""
        if b:
            category = b
        if not c or fee is None:
            continue
        use_pd = pd or "All"
        use_cat = category or "All"
        rows.append(
            {
                "pd": use_pd,
                "category": use_cat,
                "serviceCategory": c,
                "serviceFee": fee,
                "diagnosisFee": diag,
            }
        )
    return rows


def parse_cac(ws: Worksheet) -> list[dict]:
    rows: list[dict] = []
    pd = "Big-RAC, CAC & VRF"
    group = ""
    job = ""
    series = ""
    for r in range(6, ws.max_row + 1):
        a = as_text(merged_value(ws, r, 1))
        b = as_text(merged_value(ws, r, 2))
        c = as_text(merged_value(ws, r, 3))
        d = as_text(merged_value(ws, r, 4))
        e = as_text(merged_value(ws, r, 5))
        customer = as_money(merged_value(ws, r, 6))
        labor = as_money(merged_value(ws, r, 8))
        if a and "Updated" not in a and a not in {"PD", "Commercial AC Direct Labor (Rates)"}:
            pd = a
        if b:
            group = b
        if c:
            job = c
        if d:
            series = d
            # When D:E is merged, E is the series text, not capacity
            e_is_series = False
            for rng in ws.merged_cells.ranges:
                min_col, min_row, max_col, max_row = rng.bounds
                if min_row <= r <= max_row and min_col <= 4 and max_col >= 5:
                    e_is_series = True
                    break
            if e_is_series and e == d:
                e = None
        if customer is None and labor is None:
            continue
        if not group:
            continue
        rows.append(
            {
                "pd": pd,
                "repairGroup": group,
                "jobDetail": job,
                "series": series,
                "capacity": e,
                "customerFee": customer,
                "laborFee": labor,
            }
        )
    return rows


def ts_export(name: str, rows: list[dict]) -> str:
    return f"export const {name} = {json.dumps(rows, ensure_ascii=False, indent=2)} as const;\n"


def main():
    wb = load_workbook(XLSX, data_only=True)
    # Newest Other-style matrix in this file is tab 20261001 (effective Oct 2026).
    standard = parse_standard(wb["20261001"])
    cac = parse_cac(wb["CAC"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = """/* Auto-generated from 20260728_Service Charges.xlsx — do not edit by hand.
 * Standard matrix: sheet 20261001 (current prices).
 * CAC matrix: sheet CAC (commercial layout).
 */
export interface StandardFeeRow {
  pd: string;
  category: string;
  serviceCategory: string;
  serviceFee: number | null;
  diagnosisFee: number | null;
}

export interface CacFeeRow {
  pd: string;
  repairGroup: string;
  jobDetail: string | null;
  series: string | null;
  capacity: string | null;
  customerFee: number | null;
  laborFee: number | null;
}

export const workbookFile = '20260728_Service Charges.xlsx';
export const workbookUpdated = '2026-10-01';

"""
    body += ts_export("standardFees", standard)
    body += "\n"
    body += ts_export("cacFees", cac)
    # const assertion makes readonly tuples; re-export mutable-friendly aliases
    body += """
export const standardFeeRows: StandardFeeRow[] = [...standardFees];
export const cacFeeRows: CacFeeRow[] = [...cacFees];
"""
    OUT.write_text(body, encoding="utf-8")
    print("wrote", OUT)
    print("standard", len(standard), "cac", len(cac))
    print("PDs", sorted({r["pd"] for r in standard}))
    print("CAC groups", sorted({r["repairGroup"] for r in cac}))


if __name__ == "__main__":
    main()
