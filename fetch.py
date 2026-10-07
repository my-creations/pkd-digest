"""Read-only: print public PubMed metadata + abstracts as JSON lines to the job log."""
import json, time, urllib.parse, urllib.request, xml.etree.ElementTree as ET

EU = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
TERM = ('("polycystic kidney disease"[Title/Abstract] OR "autosomal dominant polycystic kidney"[Title/Abstract] OR '
        '"ADPKD"[Title/Abstract] OR "cystic kidney disease"[Title/Abstract] OR "polycystic liver disease"[Title/Abstract] OR '
        '"ARPKD"[Title/Abstract]) NOT (Letter[Publication Type] OR Comment[Publication Type] OR Editorial[Publication Type])')
FIXED = ("42753334 42760390 42744122 42744741 42761906 42741203 42799751 42792724 42779593 42796377 42789922 "
         "42784884 42792963 42779582 42826057 42808638 42829006 42828088 42826403 42813962 42831022 42804492").split()

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "pkd-digest-backfill/0.1"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def esearch(mindate, maxdate, retmax=60):
    p = {"db": "pubmed", "term": TERM, "retmax": retmax, "retmode": "json", "sort": "pub+date",
         "datetype": "edat", "mindate": mindate, "maxdate": maxdate}
    return json.loads(get(f"{EU}/esearch.fcgi?{urllib.parse.urlencode(p)}"))["esearchresult"]["idlist"]

def txt(el):
    return " ".join("".join(el.itertext()).split()) if el is not None else ""

w38 = esearch("2026/09/07", "2026/09/20")
print("W38_CANDIDATES " + json.dumps(w38))
ids = list(dict.fromkeys(w38 + FIXED))
for i in range(0, len(ids), 40):
    time.sleep(0.5)
    root = ET.fromstring(get(f"{EU}/efetch.fcgi?" + urllib.parse.urlencode({"db": "pubmed", "id": ",".join(ids[i:i+40]), "retmode": "xml"})))
    for a in root.findall(".//PubmedArticle"):
        m = a.find("MedlineCitation"); art = m.find("Article")
        pd = art.find("Journal/JournalIssue/PubDate")
        ad = art.find("ArticleDate")
        abst = []
        for at in art.findall("Abstract/AbstractText"):
            t = txt(at)
            if t:
                abst.append(f"{at.attrib['Label']}: {t}" if at.attrib.get("Label") else t)
        au = art.find("AuthorList/Author/LastName")
        rec = {
            "pmid": m.findtext("PMID"),
            "title": txt(art.find("ArticleTitle")),
            "journal": art.findtext("Journal/Title"),
            "pubdate": " ".join(x.text for x in pd if x.text) if pd is not None else "",
            "articledate": "-".join(ad.findtext(k) or "" for k in ("Year", "Month", "Day")) if ad is not None else "",
            "types": [txt(t) for t in art.findall("PublicationTypeList/PublicationType")],
            "firstauthor": au.text if au is not None else "",
            "doi": next((x.text for x in a.findall("PubmedData/ArticleIdList/ArticleId") if x.attrib.get("IdType") == "doi"), ""),
            "abstract": "\n".join(abst),
        }
        print("ART " + json.dumps(rec, ensure_ascii=False))
