#!/usr/bin/env python3
"""Produce a DRAFT shortlist of PKD / cystic kidney candidates from public PubMed.

No API keys. No auto-publish. Output is labeled draft for human review only.
Aligns with docs/content-model.md: draft cards under src/content/items/,
optional issue (YYYY-Www), locked tags/audience, status: draft.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone
from pathlib import Path

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
DEFAULT_TERM = (
    '("polycystic kidney disease"[Title/Abstract] OR '
    '"autosomal dominant polycystic kidney"[Title/Abstract] OR '
    '"ADPKD"[Title/Abstract] OR '
    '"cystic kidney disease"[Title/Abstract] OR '
    '"polycystic liver disease"[Title/Abstract] OR '
    '"ARPKD"[Title/Abstract]) '
    'NOT (Letter[Publication Type] OR Comment[Publication Type] OR Editorial[Publication Type])'
)
USER_AGENT = "pkd-digest-curate-shortlist/0.1 (public; no-key; draft-only)"


def _get(url: str, timeout: int = 45) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def esearch(term: str, retmax: int, mindate: str | None, maxdate: str | None) -> list[str]:
    params: dict[str, str] = {
        "db": "pubmed",
        "term": term,
        "retmax": str(retmax),
        "retmode": "json",
        "sort": "pub+date",
    }
    if mindate or maxdate:
        params["datetype"] = "pdat"
        if mindate:
            params["mindate"] = mindate
        if maxdate:
            params["maxdate"] = maxdate
    url = f"{EUTILS}/esearch.fcgi?{urllib.parse.urlencode(params)}"
    data = json.loads(_get(url).decode("utf-8"))
    return list(data.get("esearchresult", {}).get("idlist", []))


def efetch_summaries(pmids: list[str]) -> list[dict]:
    if not pmids:
        return []
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
    }
    url = f"{EUTILS}/efetch.fcgi?{urllib.parse.urlencode(params)}"
    root = ET.fromstring(_get(url))
    items: list[dict] = []
    for article in root.findall(".//PubmedArticle"):
        medline = article.find("MedlineCitation")
        if medline is None:
            continue
        pmid_el = medline.find("PMID")
        pmid = (pmid_el.text or "").strip() if pmid_el is not None else ""
        art = medline.find("Article")
        if art is None:
            continue
        title_el = art.find("ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else ""
        title = re.sub(r"\s+", " ", title)

        abstract_bits: list[str] = []
        abstract = art.find("Abstract")
        if abstract is not None:
            for at in abstract.findall("AbstractText"):
                label = at.attrib.get("Label")
                text = "".join(at.itertext()).strip()
                if not text:
                    continue
                abstract_bits.append(f"{label}: {text}" if label else text)
        abstract_text = re.sub(r"\s+", " ", " ".join(abstract_bits)).strip()

        journal = ""
        journal_el = art.find("Journal/Title")
        if journal_el is not None and journal_el.text:
            journal = journal_el.text.strip()

        pub_date = _parse_pub_date(art.find("Journal/JournalIssue/PubDate"))
        url_pubmed = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ""

        tags = _guess_tags(f"{title} {abstract_text}")
        stub = (abstract_text[:280] + "…") if len(abstract_text) > 280 else abstract_text

        items.append(
            {
                "title": {"en": title, "pt": ""},
                "date": pub_date,
                "source": {
                    "url": url_pubmed,
                    "name": f"PubMed | {journal}" if journal else "PubMed",
                },
                "tags": tags,
                "audience": ["patients", "clinicians"],
                "summary": {"en": stub or "", "pt": ""},
                "clinicalNote": {"en": "", "pt": ""},
                "status": "draft",
                "placeholder": False,
                "pmid": pmid,
            }
        )
    return items


def _parse_pub_date(pub_date_el: ET.Element | None) -> str:
    if pub_date_el is None:
        return date.today().isoformat()
    year = (pub_date_el.findtext("Year") or "").strip()
    month = (pub_date_el.findtext("Month") or "1").strip()
    day = (pub_date_el.findtext("Day") or "1").strip()
    if not year:
        medline = (pub_date_el.findtext("MedlineDate") or "").strip()
        m = re.match(r"(\d{4})", medline)
        return f"{m.group(1)}-01-01" if m else date.today().isoformat()
    month_map = {
        "jan": "01",
        "feb": "02",
        "mar": "03",
        "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "aug": "08",
        "sep": "09",
        "oct": "10",
        "nov": "11",
        "dec": "12",
    }
    if month.isdigit():
        mm = f"{int(month):02d}"
    else:
        mm = month_map.get(month[:3].lower(), "01")
    try:
        dd = f"{int(day):02d}"
    except ValueError:
        dd = "01"
    return f"{year}-{mm}-{dd}"


def _guess_tags(text: str) -> list[str]:
    t = text.lower()
    tags: list[str] = []
    if any(k in t for k in ("trial", "therapy", "treatment", "tolvaptan", "drug", "intervention")):
        tags.append("treatment")
    if any(k in t for k in ("lifestyle", "diet", "exercise", "self-management", "quality of life")):
        tags.append("lifestyle")
    if any(k in t for k in ("advocacy", "policy", "patient organization", "guideline")):
        tags.append("advocacy")
    if "research" not in tags:
        tags.insert(0, "research")
    # keep only allowed vocab
    allowed = {"research", "treatment", "lifestyle", "advocacy"}
    out = [x for x in tags if x in allowed]
    return out or ["research"]


def existing_source_urls(items_dir: Path) -> set[str]:
    """Source URLs already curated (published or draft), so weekly runs don't re-propose them."""
    urls: set[str] = set()
    if not items_dir.exists():
        return urls
    for path in sorted(items_dir.glob("*.md")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for match in re.finditer(r"^\s*url:\s*['\"]?(https?://[^'\"\s]+)", text, re.M):
            urls.add(match.group(1).rstrip("/"))
    return urls


def fetch_rss_items(feed_url: str, limit: int) -> list[dict]:
    """Optional public RSS (Atom/RSS). Best-effort; failures are non-fatal."""
    try:
        raw = _get(feed_url)
    except Exception as exc:  # noqa: BLE001
        print(f"warn: RSS fetch failed ({feed_url}): {exc}", file=sys.stderr)
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        print(f"warn: RSS parse failed: {exc}", file=sys.stderr)
        return []

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "dc": "http://purl.org/dc/elements/1.1/",
    }
    entries = root.findall("channel/item")
    if not entries:
        entries = root.findall("atom:entry", ns)

    items: list[dict] = []
    for entry in entries[:limit]:
        title = (entry.findtext("title") or entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        link = (entry.findtext("link") or "").strip()
        if not link:
            link_el = entry.find("atom:link", ns)
            if link_el is not None:
                link = link_el.attrib.get("href", "").strip()
        pub = (
            entry.findtext("pubDate")
            or entry.findtext("dc:date", default="", namespaces=ns)
            or entry.findtext("atom:updated", default="", namespaces=ns)
            or ""
        ).strip()
        iso = _rss_date_to_iso(pub)
        desc = (
            entry.findtext("description")
            or entry.findtext("atom:summary", default="", namespaces=ns)
            or ""
        ).strip()
        desc = re.sub(r"<[^>]+>", "", desc)
        desc = re.sub(r"\s+", " ", desc).strip()
        stub = (desc[:280] + "…") if len(desc) > 280 else desc
        if not title or not link:
            continue
        items.append(
            {
                "title": {"en": title, "pt": ""},
                "date": iso,
                "source": {"url": link, "name": "RSS"},
                "tags": _guess_tags(f"{title} {desc}"),
                "audience": ["patients", "clinicians"],
                "summary": {"en": stub or "", "pt": ""},
                "clinicalNote": {"en": "", "pt": ""},
                "status": "draft",
                "placeholder": False,
            }
        )
    return items


def _rss_date_to_iso(value: str) -> str:
    if not value:
        return date.today().isoformat()
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    m = re.search(r"(\d{4}-\d{2}-\d{2})", value)
    return m.group(1) if m else date.today().isoformat()


def slugify(title: str, pmid: str | None = None) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60] or "item"
    if pmid:
        return f"{base}-{pmid}"
    return base


def to_item_markdown(item: dict) -> str:
    """Emit one draft card matching docs/content-model.md (src/content/items/)."""
    source = item.get("source") or {}
    tags = item.get("tags") or ["research"]
    audience = item.get("audience") or ["patients", "clinicians"]
    summary = item.get("summary") or {}
    clinical = item.get("clinicalNote") or {}

    def yaml_str(s: str) -> str:
        if s == "":
            return '""'
        if any(c in s for c in ':"\'\n') or s.startswith(" "):
            escaped = s.replace("\\", "\\\\").replace('"', '\\"')
            return f'"{escaped}"'
        return f'"{s}"'

    raw_title = item.get("title") or ""
    title = raw_title if isinstance(raw_title, dict) else {"en": raw_title, "pt": ""}
    lines = [
        "---",
        "title:",
        f"  en: {yaml_str(title.get('en') or '')}",
        f"  pt: {yaml_str(title.get('pt') or '')}",
        f"date: {item.get('date') or date.today().isoformat()}",
    ]
    issue = (item.get("issue") or "").strip()
    if issue:
        lines.append(f"issue: {yaml_str(issue)}")
    lines.extend(
        [
            "source:",
            f"  url: {yaml_str(source.get('url') or '')}",
            f"  name: {yaml_str(source.get('name') or '')}",
            f"tags: [{', '.join(tags)}]",
            f"audience: [{', '.join(audience)}]",
            "summary:",
            f"  en: {yaml_str(summary.get('en') or '')}",
            f"  pt: {yaml_str(summary.get('pt') or '')}",
            "clinicalNote:",
            f"  en: {yaml_str(clinical.get('en') or '')}",
            f"  pt: {yaml_str(clinical.get('pt') or '')}",
            "status: draft",
            f"placeholder: {str(bool(item.get('placeholder', False))).lower()}",
            "---",
            "",
            "<!-- DRAFT / NOT PUBLISHED — human review required; set issue + Dual Framing before publish -->",
            "",
        ]
    )
    return "\n".join(lines)



def write_outputs(
    items: list[dict],
    out_dir: Path,
    stamp: str,
    items_dir: Path,
    issue: str | None = None,
) -> tuple[Path, Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"shortlist-{stamp}.json"
    md_path = out_dir / f"shortlist-{stamp}.md"
    items_dir.mkdir(parents=True, exist_ok=True)

    if issue:
        for item in items:
            item["issue"] = issue

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "label": "DRAFT / NOT PUBLISHED — for human review only",
        "queryNote": "Public PubMed E-utilities (+ optional RSS). No secrets. No auto-publish.",
        "contentModel": "docs/content-model.md — status: draft under src/content/items/",
        "issue": issue,
        "count": len(items),
        "items": items,
    }
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md_lines = [
        f"# DRAFT shortlist — {stamp}",
        "",
        "> **Not published.** Human reviews this list, completes Dual Framing (EN+PT), optionally sets `issue: YYYY-Www`, then sets `status: published`.",
        "",
        f"Generated: `{payload['generatedAt']}`  ",
        f"Candidates: **{len(items)}**",
        f"Draft cards dir: `{items_dir}`",
        "",
    ]
    if issue:
        md_lines.insert(-1, f"Issue stamp: `{issue}`")
        md_lines.append("")

    for i, item in enumerate(items, 1):
        src = item.get("source") or {}
        title = item.get("title")
        display_title = title.get("en") if isinstance(title, dict) else title
        md_lines.extend(
            [
                f"## {i}. {display_title or '(untitled)'}",
                "",
                f"- date: `{item.get('date')}`",
                f"- source: [{src.get('name') or 'source'}]({src.get('url') or '#'})",
                f"- tags: {', '.join(item.get('tags') or [])}",
                f"- status: `draft`",
                "",
            ]
        )
        slug = slugify(display_title or "item", item.get("pmid"))
        card_path = items_dir / f"{slug}.md"
        card_path.write_text(to_item_markdown(item), encoding="utf-8")
        md_lines.append(f"- draft card: `{card_path.as_posix()}`")
        md_lines.append("")

    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    return json_path, md_path, items_dir



def main() -> int:
    parser = argparse.ArgumentParser(description="Draft PKD Digest shortlist from public PubMed/RSS.")
    parser.add_argument("--term", default=DEFAULT_TERM, help="PubMed query")
    parser.add_argument("--retmax", type=int, default=8, help="Max PubMed results")
    parser.add_argument("--mindate", default=None, help="PubMed mindate YYYY/MM/DD")
    parser.add_argument("--maxdate", default=None, help="PubMed maxdate YYYY/MM/DD")
    parser.add_argument(
        "--rss",
        action="append",
        default=[],
        help="Optional public RSS/Atom URL (repeatable)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(Path(__file__).resolve().parents[1] / "curation" / "generated"),
        help="Output directory for shortlist JSON/MD indexes",
    )
    parser.add_argument(
        "--items-dir",
        default=str(Path(__file__).resolve().parents[1] / "src" / "content" / "items"),
        help="Directory for draft item markdown (default: src/content/items)",
    )
    parser.add_argument(
        "--issue",
        default=None,
        help="Optional Weekly Issue stamp YYYY-Www to stamp on draft cards",
    )
    parser.add_argument(
        "--stamp",
        default=date.today().isoformat(),
        help="Filename stamp (default: today ISO date)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Drop candidates whose source URL is already curated under --items-dir",
    )
    args = parser.parse_args()

    print("Fetching PubMed (public E-utilities, no API key)…", file=sys.stderr)
    try:
        pmids = esearch(args.term, args.retmax, args.mindate, args.maxdate)
        pubmed_items = efetch_summaries(pmids)
    except Exception as exc:  # noqa: BLE001
        print(f"error: PubMed fetch failed: {exc}", file=sys.stderr)
        return 1

    rss_items: list[dict] = []
    for feed in args.rss:
        rss_items.extend(fetch_rss_items(feed, limit=5))

    # de-dupe by source.url
    seen: set[str] = set()
    merged: list[dict] = []
    for item in pubmed_items + rss_items:
        url = (item.get("source") or {}).get("url") or ""
        if url and url in seen:
            continue
        if url:
            seen.add(url)
        merged.append(item)

    if args.skip_existing:
        known = existing_source_urls(Path(args.items_dir))
        before = len(merged)
        merged = [
            item
            for item in merged
            if ((item.get("source") or {}).get("url") or "").rstrip("/") not in known
        ]
        print(f"Skipped {before - len(merged)} already-curated item(s).", file=sys.stderr)

    json_path, md_path, items_dir = write_outputs(
        merged, Path(args.out_dir), args.stamp, Path(args.items_dir), args.issue
    )
    print(f"Wrote DRAFT shortlist JSON: {json_path}")
    print(f"Wrote DRAFT shortlist MD:   {md_path}")
    print(f"Wrote DRAFT item cards:     {items_dir}/")
    print("Label: DRAFT / NOT PUBLISHED — do not deploy; human review required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
