"""从实测表生成前端数据模块。

产出 `src/data/measured.ts`，不参与构建，只在原始表格更新后手动跑一次。

    python scripts/gen-measured.py --power 宿舍设备_24小时功率与总耗电量汇总_最新版.xlsx

依赖 openpyxl（`pip install openpyxl`）。脚本对 144 个区间和 24:00 闭合点做了断言，
表格结构变了会直接报错，不会静默生成一份错的模块。

原始表记录 12 类设备，但场景里只有 5 类有对应模型。没有模型的设备不进前端：
它们的功率既算不进全寝总功率，也不出现在面板的列表里。
"""

import argparse
import json
from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent

# 原始表 12 列的固定顺序，用来按列取数
COLUMNS = [
    "iphone",
    "android",
    "macbook",
    "gaming",
    "tablet",
    "led",
    "lamp",
    "ac",
    "kettle",
    "dryer",
    "washer",
    "cooker",
]

# 场景里建了模型的组；其余 7 类只有记录没有模型，一律不输出
MODELLED = ["iphone", "macbook", "gaming", "tablet", "lamp"]


def read_power(src: Path):
    wb = openpyxl.load_workbook(src, data_only=True)
    summary = wb["设备功率与耗电量汇总"]
    matrix = wb["24小时设备功率矩阵"]

    # 汇总表：第 4 行表头（B..M），第 5-10 行指标
    names = [summary.cell(row=4, column=c).value for c in range(2, 14)]
    metrics = {}
    for row in range(5, 11):
        label = str(summary.cell(row=row, column=1).value or "").strip()
        metrics[label] = [summary.cell(row=row, column=c).value for c in range(2, 14)]

    avg = metrics["24小时平均输入功率（W）"]
    peak = metrics["最高记录输入功率（W）"]
    kwh = metrics["24小时累计耗电量（kWh）"]
    hours = metrics["设备有功率记录时长（h）"]

    # 矩阵表：第 2 行表头，第 3 行起 10 分钟一条
    rows = []
    for row in range(3, matrix.max_row + 1):
        time = matrix.cell(row=row, column=1).value
        if not time:
            continue
        values = [matrix.cell(row=row, column=c).value for c in range(2, 14)]
        if all(v is None for v in values):
            continue
        rows.append((str(time).strip(), [int(round(v or 0)) for v in values]))

    # 24:00 是次日边界，只作为曲线的闭合点，不计入 144 个有效区间
    closing = [r for r in rows if r[0].startswith("24:00")]
    window = [r for r in rows if not r[0].startswith("24:00")]
    assert len(window) == 144, f"有效区间应为 144，实际 {len(window)}"
    assert len(closing) == 1, "缺少 24:00 闭合点"

    groups = []
    for gid in MODELLED:
        i = COLUMNS.index(gid)
        groups.append(
            {
                "id": gid,
                "name": str(names[i]).strip(),
                "avgW": round(float(avg[i]), 2),
                "peakW": int(round(float(peak[i]))),
                "energyWh": round(float(kwh[i]) * 1000, 1),
                "hours": round(float(hours[i]), 2),
                "series": [r[1][i] for r in window],
            }
        )
    return groups, [r[0] for r in window]


def emit(out_dir: Path, groups, times):
    out_dir.mkdir(parents=True, exist_ok=True)

    def arr(values):
        return "[" + ",".join(str(v) for v in values) + "]"

    lines = [
        "/**",
        " * 宿舍实测用电数据。",
        " *",
        " * 来源：宿舍设备｜24小时功率与耗电量汇总（最新版）.xlsx",
        " * 口径：00:00—23:50 共 144 个十分钟区间；24:00 为次日边界，仅作曲线闭合点。",
        " * 只收录场景里建了模型的 5 类设备，原始表其余 7 类不进前端。",
        " * 该文件由 scripts/gen-measured.py 从原始 xlsx 直接生成，请勿手改数值。",
        " */",
        "",
        "export type MeasuredGroup = {",
        "  id: string",
        "  name: string",
        "  /** 24 小时平均输入功率（W） */",
        "  avgW: number",
        "  /** 记录到的最高功率（W） */",
        "  peakW: number",
        "  /** 24 小时累计耗电量（Wh） */",
        "  energyWh: number",
        "  /** 有功率记录的时长（h） */",
        "  hours: number",
        "  /** 144 个十分钟区间的功率读数（W） */",
        "  series: number[]",
        "}",
        "",
        "export const MEASURED_INTERVAL_MINUTES = 10",
        "export const MEASURED_INTERVALS = 144",
        "",
        "/** 区间起点，00:00—23:50 */",
        f"export const MEASURED_TIMES: string[] = {json.dumps(times, ensure_ascii=False)}",
        "",
        "export const MEASURED_GROUPS: MeasuredGroup[] = [",
    ]
    for g in groups:
        lines.append("  {")
        lines.append(f"    id: {json.dumps(g['id'])},")
        lines.append(f"    name: {json.dumps(g['name'], ensure_ascii=False)},")
        lines.append(f"    avgW: {g['avgW']},")
        lines.append(f"    peakW: {g['peakW']},")
        lines.append(f"    energyWh: {g['energyWh']},")
        lines.append(f"    hours: {g['hours']},")
        lines.append(f"    series: {arr(g['series'])},")
        lines.append("  },")
    lines += [
        "]",
        "",
        "export const MEASURED_MAP = Object.fromEntries(",
        "  MEASURED_GROUPS.map((group) => [group.id, group]),",
        ") as Record<string, MeasuredGroup>",
        "",
    ]
    (out_dir / "measured.ts").write_text("\n".join(lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--power", required=True, help="24 小时功率与耗电量汇总表")
    parser.add_argument(
        "--out",
        default=str(REPO / "src" / "data"),
        help="输出目录，默认 src/data",
    )
    args = parser.parse_args()

    groups, times = read_power(Path(args.power))
    emit(Path(args.out), groups, times)

    print(
        json.dumps(
            {
                "groups": [(g["id"], g["name"], g["avgW"], g["peakW"]) for g in groups],
                "intervals": len(times),
            },
            ensure_ascii=False,
            indent=1,
        )
    )


if __name__ == "__main__":
    main()
