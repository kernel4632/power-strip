"""从两份实测表生成前端数据模块。

产出 `src/data/measured.ts` 与 `src/data/strips.ts`，不参与构建，只在原始表格
更新后手动跑一次。

    python scripts/gen-measured.py \
        --power 宿舍设备_24小时功率与总耗电量汇总_最新版.xlsx \
        --strips 排插数据.xlsx

依赖 openpyxl（`pip install openpyxl`）。脚本对 144 个区间和 24:00 闭合点做了断言，
表格结构变了会直接报错，不会静默生成一份错的模块。
"""

import argparse
import json
from pathlib import Path

import openpyxl

REPO = Path(__file__).resolve().parent.parent

# 12 类设备 -> 稳定的英文 id，供前端引用
GROUP_IDS = [
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


def read_power(src: Path):
    wb = openpyxl.load_workbook(src, data_only=True)
    summary = wb["设备功率与耗电量汇总"]
    matrix = wb["24小时设备功率矩阵"]

    # 汇总表：第 4 行表头（B..N），第 5-10 行指标
    names = [summary.cell(row=4, column=c).value for c in range(2, 15)]
    metrics = {}
    for row in range(5, 11):
        label = str(summary.cell(row=row, column=1).value or "").strip()
        metrics[label] = [summary.cell(row=row, column=c).value for c in range(2, 15)]

    avg = metrics["24小时平均输入功率（W）"]
    peak = metrics["最高记录输入功率（W）"]
    kwh = metrics["24小时累计耗电量（kWh）"]
    hours = metrics["设备有功率记录时长（h）"]
    share = metrics["耗电量占全部设备比例（%）"]

    # 矩阵表：第 2 行表头，第 3 行起 10 分钟一条
    rows = []
    for row in range(3, matrix.max_row + 1):
        time = matrix.cell(row=row, column=1).value
        if not time:
            continue
        values = [matrix.cell(row=row, column=c).value for c in range(2, 15)]
        if all(v is None for v in values):
            continue
        rows.append((str(time).strip(), [int(round(v or 0)) for v in values]))

    # 24:00 是次日边界，只作为曲线的闭合点，不计入 144 个有效区间
    closing = [r for r in rows if r[0].startswith("24:00")]
    window = [r for r in rows if not r[0].startswith("24:00")]
    assert len(window) == 144, f"有效区间应为 144，实际 {len(window)}"
    assert len(closing) == 1, "缺少 24:00 闭合点"

    groups = []
    for i, gid in enumerate(GROUP_IDS):
        series = [r[1][i] for r in window]
        groups.append(
            {
                "id": gid,
                "name": str(names[i]).strip(),
                "avgW": round(float(avg[i]), 2),
                "peakW": int(round(float(peak[i]))),
                "energyWh": round(float(kwh[i]) * 1000, 1),
                "hours": round(float(hours[i]), 2),
                "share": round(float(share[i]), 6),
                "series": series,
            }
        )

    total_series = [r[1][12] for r in window]
    total = {
        "name": str(names[12]).strip(),
        "avgW": round(float(avg[12]), 2),
        "peakW": int(round(float(peak[12]))),
        "energyWh": round(float(kwh[12]) * 1000, 1),
        "hours": round(float(hours[12]), 2),
        "series": total_series,
        "closingW": closing[0][1][12],
    }
    return groups, total, [r[0] for r in window]


def read_strips(src: Path):
    wb = openpyxl.load_workbook(src, data_only=True)
    ws = wb[wb.sheetnames[0]]
    items = []
    for row in range(2, ws.max_row + 1):
        name = ws.cell(row=row, column=1).value
        if not name:
            continue
        ports = ws.cell(row=row, column=2).value
        power = ws.cell(row=row, column=3).value
        size = ws.cell(row=row, column=4).value
        price_raw = ws.cell(row=row, column=5).value

        max_w = int(str(power).lower().replace("w", "").strip())
        price_text = str(price_raw).lower().replace("rmb", "").replace("rm", "").strip()
        price = float(price_text)
        # 孔位数：纯数字直接用；含 USB 的描述保留文字，另记一个可排序的插孔数
        if isinstance(ports, (int, float)):
            ports_text = f"{int(ports)} 孔"
            ports_count = int(ports)
        else:
            ports_text = str(ports).strip()
            head = ports_text.split("孔")[0]
            ports_count = int(head) if head.isdigit() else 0

        items.append(
            {
                "name": str(name).strip(),
                "brand": "绿联" if str(name).startswith("绿联") else "公牛",
                "ports": ports_text,
                "portsCount": ports_count,
                "maxW": max_w,
                "size": str(size).strip().replace("*", "×").replace("x", "×"),
                "price": price,
            }
        )
    return items


def emit(out_dir: Path, groups, total, times, strips):
    out_dir.mkdir(parents=True, exist_ok=True)

    def arr(values):
        return "[" + ",".join(str(v) for v in values) + "]"

    lines = [
        "/**",
        " * 宿舍实测用电数据。",
        " *",
        " * 来源：宿舍设备｜24小时功率与耗电量汇总（最新版）.xlsx",
        " * 口径：00:00—23:50 共 144 个十分钟区间，12 类设备；24:00 为次日边界，仅作曲线闭合点。",
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
        "  /** 占全部设备耗电量比例（0–1） */",
        "  share: number",
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
        lines.append(f"    share: {g['share']},")
        lines.append(f"    series: {arr(g['series'])},")
        lines.append("  },")
    lines += [
        "]",
        "",
        "export const MEASURED_TOTAL = {",
        f"  avgW: {total['avgW']},",
        f"  peakW: {total['peakW']},",
        f"  energyWh: {total['energyWh']},",
        f"  hours: {total['hours']},",
        f"  closingW: {total['closingW']},",
        f"  series: {arr(total['series'])},",
        "}",
        "",
        "export const MEASURED_MAP = Object.fromEntries(",
        "  MEASURED_GROUPS.map((group) => [group.id, group]),",
        ") as Record<string, MeasuredGroup>",
        "",
    ]
    (out_dir / "measured.ts").write_text("\n".join(lines), encoding="utf-8")

    strip_lines = [
        "/**",
        " * 在售插排规格（用于与本设计对照）。",
        " *",
        " * 来源：排插数据(2).xlsx，共 12 款，价格单位为元。",
        " * 原始表里 E2 写作「28.9rm」，按 28.9 元处理；尺寸分隔符已统一成「×」。",
        " * 该文件由 scripts/gen-measured.py 从原始 xlsx 直接生成，请勿手改数值。",
        " */",
        "export type StripSpec = {",
        "  name: string",
        "  brand: '公牛' | '绿联'",
        "  /** 原始孔位描述，含 USB 口 */",
        "  ports: string",
        "  /** 可排序的插孔数，含 USB 的描述按数字部分取值 */",
        "  portsCount: number",
        "  maxW: number",
        "  size: string",
        "  /** 参考价（元） */",
        "  price: number",
        "}",
        "",
        "export const STRIP_SPECS: StripSpec[] = [",
    ]
    for s in strips:
        strip_lines.append("  {")
        strip_lines.append(f"    name: {json.dumps(s['name'], ensure_ascii=False)},")
        strip_lines.append(f"    brand: {json.dumps(s['brand'], ensure_ascii=False)},")
        strip_lines.append(f"    ports: {json.dumps(s['ports'], ensure_ascii=False)},")
        strip_lines.append(f"    portsCount: {s['portsCount']},")
        strip_lines.append(f"    maxW: {s['maxW']},")
        strip_lines.append(f"    size: {json.dumps(s['size'], ensure_ascii=False)},")
        strip_lines.append(f"    price: {s['price']},")
        strip_lines.append("  },")
    strip_lines += ["]", ""]
    (out_dir / "strips.ts").write_text("\n".join(strip_lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--power", required=True, help="24 小时功率与耗电量汇总表")
    parser.add_argument("--strips", required=True, help="在售插排规格表")
    parser.add_argument(
        "--out",
        default=str(REPO / "src" / "data"),
        help="输出目录，默认 src/data",
    )
    args = parser.parse_args()

    groups, total, times = read_power(Path(args.power))
    strips = read_strips(Path(args.strips))
    emit(Path(args.out), groups, total, times, strips)

    print(
        json.dumps(
            {
                "groups": [(g["id"], g["name"], g["avgW"], g["peakW"]) for g in groups],
                "total": {k: total[k] for k in ("avgW", "peakW", "energyWh", "closingW")},
                "intervals": len(times),
                "strips": len(strips),
            },
            ensure_ascii=False,
            indent=1,
        )
    )


if __name__ == "__main__":
    main()
